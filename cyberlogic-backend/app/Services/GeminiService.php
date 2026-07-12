<?php

namespace App\Services;

use Gemini\Laravel\Facades\Gemini;
use Gemini\Data\GenerationConfig;
use Gemini\Enums\ResponseMimeType;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Moderate a text message using Gemini API.
     *
     * @param string $text
     * @return array Contains 'is_harmful' (bool) and 'reason' (string|null)
     */
    public static function moderate(string $text): array
    {
        $apiKey = config('gemini.api_key') ?: config('services.gemini.key');
        $model = env('GEMINI_MODEL', 'gemini-3.1-flash-lite');

        if (empty($apiKey)) {
            Log::warning('Gemini API key is not configured. Skipping content moderation checks.');
            return [
                'is_harmful' => false,
                'reason' => null
            ];
        }

        try {
            $prompt = "You are a strict chat content moderator. Analyze the following user chat message. Check if the message is toxic, inappropriate, harmful, contains hate speech, harassment, self-harm, sexual content, violence, or otherwise violates chat safety guidelines.\n\n" .
                      "Respond strictly in JSON format with the following structure:\n" .
                      "{\n" .
                      "    \"is_harmful\": true or false,\n" .
                      "    \"reason\": \"A short explanation (max 10 words) of why the message was flagged, or null if it is safe and appropriate.\"\n" .
                      "}\n\n" .
                      "Message to analyze:\n" .
                      "\"{$text}\"";

            $config = new GenerationConfig(
                responseMimeType: ResponseMimeType::APPLICATION_JSON
            );

            // Use the Laravel Gemini Facade
            $response = Gemini::generativeModel(model: $model)
                ->withGenerationConfig($config)
                ->generateContent($prompt);

            $responseText = $response->text();

            if (empty($responseText)) {
                Log::warning('Gemini API returned an empty response candidate.');
                return [
                    'is_harmful' => false,
                    'reason' => null
                ];
            }

            $result = json_decode(trim($responseText), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini moderation JSON response: ' . $responseText);
                return [
                    'is_harmful' => false,
                    'reason' => null
                ];
            }

            return [
                'is_harmful' => filter_var($result['is_harmful'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'reason' => $result['reason'] ?? null
            ];

        } catch (\Throwable $e) {
            Log::error('Error occurred during Gemini content moderation: ' . $e->getMessage());
            return [
                'is_harmful' => false,
                'reason' => 'AI Moderation check failed with error'
            ];
        }
    }

    /**
     * Moderate a batch of text messages using Gemini API.
     *
     * @param array $messages Array of items: [['id' => 123, 'content' => 'hello'], ...]
     * @return array Array of results: [['id' => 123, 'is_harmful' => false, 'reason' => null], ...]
     */
    public static function moderateBatch(array $messages): array
    {
        $apiKey = config('gemini.api_key') ?: config('services.gemini.key');
        $model = env('GEMINI_MODEL', 'gemini-3.1-flash-lite');

        if (empty($apiKey) || empty($messages)) {
            return [];
        }

        try {
            $formattedMessages = json_encode($messages, JSON_PRETTY_PRINT);
            $prompt = "You are a strict chat content moderator. Analyze the following list of user chat messages. Check each message for toxicity, inappropriateness, harm, hate speech, harassment, self-harm, sexual content, violence, or other violations of chat safety guidelines.\n\n" .
                      "Respond strictly in JSON array format containing the evaluation of each message. Each item in the array must follow this exact structure:\n" .
                      "{\n" .
                      "    \"id\": the numeric ID of the message,\n" .
                      "    \"is_harmful\": true or false,\n" .
                      "    \"reason\": \"A short explanation (max 10 words) of why the message was flagged, or null if it is safe and appropriate.\"\n" .
                      "}\n\n" .
                      "Here is the list of messages in JSON format to analyze:\n" .
                      "{$formattedMessages}";

            $config = new GenerationConfig(
                responseMimeType: ResponseMimeType::APPLICATION_JSON
            );

            $response = Gemini::generativeModel(model: $model)
                ->withGenerationConfig($config)
                ->generateContent($prompt);

            $responseText = $response->text();

            if (empty($responseText)) {
                return [];
            }

            $result = json_decode(trim($responseText), true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($result)) {
                Log::error('Failed to parse Gemini batch moderation JSON response: ' . $responseText);
                return [];
            }

            return $result;

        } catch (\Throwable $e) {
            Log::error('Error occurred during Gemini batch content moderation: ' . $e->getMessage());
            return [];
        }
    }
}
