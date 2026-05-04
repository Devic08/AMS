<?php

declare(strict_types=1);

function get_database_connection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = '127.0.0.1';
    $port = 3306;
    $database = 'asset_management_system';
    $username = 'root';
    $password = '';

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $database);

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}
