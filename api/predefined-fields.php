<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = get_database_connection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        respond_success(fetch_groups($pdo));
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = json_decode(file_get_contents('php://input') ?: '[]', true);

        if (!is_array($payload)) {
            respond_error('Invalid request payload.', 400);
        }

        handle_post_request($pdo, $payload);
    }

    respond_error('Method not allowed.', 405);
} catch (Throwable $exception) {
    respond_error($exception->getMessage(), 500);
}

function handle_post_request(PDO $pdo, array $payload): void
{
    $action = trim((string)($payload['action'] ?? ''));
    $fieldKey = trim((string)($payload['field_key'] ?? ''));
    $valueLabel = trim((string)($payload['value_label'] ?? ''));
    $valueId = (int)($payload['value_id'] ?? 0);
    $fieldLabel = trim((string)($payload['field_label'] ?? ''));
    $fieldDescription = trim((string)($payload['field_description'] ?? ''));

    if ($action === 'create_group') {
        if ($fieldLabel === '') {
            respond_error('Sub field name is required.', 422);
        }

        $generatedKey = create_field_key($fieldLabel);
        assert_unique_field_key($pdo, $generatedKey);

        $insert = $pdo->prepare(
            'INSERT INTO predefined_field_groups (field_key, field_label, field_description, display_order, is_active)
             VALUES (
                :field_key,
                :field_label,
                :field_description,
                COALESCE((SELECT MAX(display_order) + 1 FROM predefined_field_groups), 1),
                1
             )'
        );
        $insert->execute([
            'field_key' => $generatedKey,
            'field_label' => $fieldLabel,
            'field_description' => $fieldDescription !== '' ? $fieldDescription : null,
        ]);

        respond_success(fetch_groups($pdo), 'Sub field created successfully.');
    }

    if ($fieldKey === '') {
        respond_error('Field key is required.', 422);
    }

    $group = find_group_by_key($pdo, $fieldKey);

    if (!$group) {
        respond_error('Unknown predefined field group.', 404);
    }

    if ($action === 'create') {
        if ($valueLabel === '') {
            respond_error('Field value is required.', 422);
        }

        assert_unique_value($pdo, (int)$group['group_id'], $valueLabel);

        $insert = $pdo->prepare(
            'INSERT INTO predefined_field_values (group_id, value_label, sort_order)
             VALUES (:group_id, :value_label, COALESCE((SELECT MAX(sort_order) + 1 FROM predefined_field_values WHERE group_id = :group_id_lookup), 1))'
        );
        $insert->execute([
            'group_id' => $group['group_id'],
            'group_id_lookup' => $group['group_id'],
            'value_label' => $valueLabel,
        ]);

        respond_success(fetch_groups($pdo), 'Field value added successfully.');
    }

    if ($action === 'update') {
        if ($valueId <= 0) {
            respond_error('Value id is required.', 422);
        }

        if ($valueLabel === '') {
            respond_error('Updated field value is required.', 422);
        }

        assert_value_belongs_to_group($pdo, $valueId, (int)$group['group_id']);
        assert_unique_value($pdo, (int)$group['group_id'], $valueLabel, $valueId);

        $update = $pdo->prepare(
            'UPDATE predefined_field_values
             SET value_label = :value_label
             WHERE value_id = :value_id'
        );
        $update->execute([
            'value_label' => $valueLabel,
            'value_id' => $valueId,
        ]);

        respond_success(fetch_groups($pdo), 'Field value updated successfully.');
    }

    if ($action === 'delete') {
        if ($valueId <= 0) {
            respond_error('Value id is required.', 422);
        }

        assert_value_belongs_to_group($pdo, $valueId, (int)$group['group_id']);

        $delete = $pdo->prepare('DELETE FROM predefined_field_values WHERE value_id = :value_id');
        $delete->execute(['value_id' => $valueId]);

        respond_success(fetch_groups($pdo), 'Field value deleted successfully.');
    }

    if ($action === 'update_group') {
        if ($fieldLabel === '') {
            respond_error('Sub field name is required.', 422);
        }

        $update = $pdo->prepare(
            'UPDATE predefined_field_groups
             SET field_label = :field_label,
                 field_description = :field_description
             WHERE group_id = :group_id'
        );
        $update->execute([
            'field_label' => $fieldLabel,
            'field_description' => $fieldDescription !== '' ? $fieldDescription : null,
            'group_id' => $group['group_id'],
        ]);

        respond_success(fetch_groups($pdo), 'Sub field updated successfully.');
    }

    if ($action === 'delete_group') {
        $delete = $pdo->prepare('DELETE FROM predefined_field_groups WHERE group_id = :group_id');
        $delete->execute(['group_id' => $group['group_id']]);
        respond_success(fetch_groups($pdo), 'Sub field deleted successfully.');
    }

    respond_error('Unsupported action.', 422);
}

function fetch_groups(PDO $pdo): array
{
    $groupQuery = $pdo->query(
        'SELECT group_id, field_key, field_label, field_description
         FROM predefined_field_groups
         WHERE is_active = 1
         ORDER BY display_order, group_id'
    );

    $valueQuery = $pdo->query(
        'SELECT value_id, group_id, value_label
         FROM predefined_field_values
         WHERE is_active = 1
         ORDER BY sort_order, value_label, value_id'
    );

    $groups = [];

    foreach ($groupQuery->fetchAll() as $group) {
        $group['values'] = [];
        $groups[(int)$group['group_id']] = $group;
    }

    foreach ($valueQuery->fetchAll() as $value) {
        $groupId = (int)$value['group_id'];

        if (!isset($groups[$groupId])) {
            continue;
        }

        $groups[$groupId]['values'][] = $value;
    }

    return ['groups' => array_values($groups)];
}

function find_group_by_key(PDO $pdo, string $fieldKey): ?array
{
    $statement = $pdo->prepare(
        'SELECT group_id, field_key, field_label, field_description
         FROM predefined_field_groups
         WHERE field_key = :field_key AND is_active = 1
         LIMIT 1'
    );
    $statement->execute(['field_key' => $fieldKey]);
    $group = $statement->fetch();

    return $group ?: null;
}

function assert_unique_value(PDO $pdo, int $groupId, string $valueLabel, ?int $ignoreValueId = null): void
{
    $statement = $pdo->prepare(
        'SELECT value_id
         FROM predefined_field_values
         WHERE group_id = :group_id
           AND LOWER(value_label) = LOWER(:value_label)
           AND (:ignore_value_id IS NULL OR value_id <> :ignore_value_id)
         LIMIT 1'
    );
    $statement->bindValue('group_id', $groupId, PDO::PARAM_INT);
    $statement->bindValue('value_label', $valueLabel, PDO::PARAM_STR);
    $statement->bindValue('ignore_value_id', $ignoreValueId, $ignoreValueId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $statement->execute();

    if ($statement->fetch()) {
        respond_error('That value already exists in this predefined field.', 409);
    }
}

function assert_value_belongs_to_group(PDO $pdo, int $valueId, int $groupId): void
{
    $statement = $pdo->prepare(
        'SELECT value_id
         FROM predefined_field_values
         WHERE value_id = :value_id AND group_id = :group_id
         LIMIT 1'
    );
    $statement->execute([
        'value_id' => $valueId,
        'group_id' => $groupId,
    ]);

    if (!$statement->fetch()) {
        respond_error('Field value not found for this group.', 404);
    }
}

function create_field_key(string $fieldLabel): string
{
    $normalized = strtolower(trim($fieldLabel));
    $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized) ?? '';
    $normalized = trim($normalized, '_');

    if ($normalized === '') {
        respond_error('Unable to create a valid field key for this sub field.', 422);
    }

    return $normalized;
}

function assert_unique_field_key(PDO $pdo, string $fieldKey): void
{
    $statement = $pdo->prepare(
        'SELECT group_id
         FROM predefined_field_groups
         WHERE field_key = :field_key
         LIMIT 1'
    );
    $statement->execute(['field_key' => $fieldKey]);

    if ($statement->fetch()) {
        respond_error('A sub field with the same name already exists.', 409);
    }
}

function respond_success(array $data, string $message = 'OK'): void
{
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        ...$data,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_error(string $message, int $statusCode): void
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}
