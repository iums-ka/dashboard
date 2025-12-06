<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'custom_search_api_key' => env('GOOGLE_CUSTOM_SEARCH_API_KEY'),
        'custom_search_engine_id' => env('GOOGLE_CUSTOM_SEARCH_ENGINE_ID'),
    ],

    'nextcloud' => [
        'url' => env('NEXTCLOUD_URL'),
        'username' => env('NEXTCLOUD_USERNAME'),
        'password' => env('NEXTCLOUD_PASSWORD'),
        'file_path' => env('NEXTCLOUD_FILE_PATH', '/Documents/proposals.csv'),
        'deck' => [
            'default_boards' => env('NEXTCLOUD_DECK_DEFAULT_BOARDS'), // Comma-separated board IDs
        ],
    ],

    'mensa' => [
        'api_url' => env('MENSA_API_URL'),
        'api_key' => env('API_KEY'),
        'location_id' => env('ORT_ID'),
    ],

];
