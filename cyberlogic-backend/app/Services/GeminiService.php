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
                'reason' => null,
                'intent' => 'general'
            ];
        }

        try {
            $prompt = "You are a strict chat content moderator and sentiment analyzer. Analyze the following user chat message.\n" .
                      "1. Check if the message is toxic, inappropriate, harmful, contains hate speech, harassment, self-harm, sexual content, violence, or otherwise violates safety guidelines.\n" .
                      "2. Classify the main intent or vibe of the message into exactly one of these categories: 'general' (neutral, typical, default), 'love' (romance, appreciation, affection, kindness), 'confidence' (motivational, supportive, reassurance, courage), 'sadness' (venting pain, feeling down, grief, lonely), 'joy' (celebrating, excitement, laughter, happy), 'gratitude' (thankful, expressing appreciation/relief), 'curiosity' (asking questions, seeking information).\n\n" .
                      "Respond strictly in JSON format with the following structure:\n" .
                      "{\n" .
                      "    \"is_harmful\": true or false,\n" .
                      "    \"reason\": \"A short explanation (max 10 words) of why the message was flagged, or null if it is safe.\",\n" .
                      "    \"intent\": \"general\" or \"love\" or \"confidence\" or \"sadness\" or \"joy\" or \"gratitude\" or \"curiosity\"\n" .
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
                    'reason' => null,
                    'intent' => 'general'
                ];
            }

            $result = json_decode(trim($responseText), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini moderation JSON response: ' . $responseText);
                return [
                    'is_harmful' => false,
                    'reason' => null,
                    'intent' => 'general'
                ];
            }

            return [
                'is_harmful' => filter_var($result['is_harmful'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'reason' => $result['reason'] ?? null,
                'intent' => $result['intent'] ?? 'general'
            ];

        } catch (\Throwable $e) {
            Log::error('Error occurred during Gemini content moderation: ' . $e->getMessage());
            return [
                'is_harmful' => false,
                'reason' => 'AI Moderation check failed with error',
                'intent' => 'general'
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
            $prompt = "You are a strict chat content moderator and sentiment analyzer. Analyze the following list of user chat messages.\n" .
                      "1. Check each message for toxicity, safety violations, hate speech, or inappropriate content.\n" .
                      "2. Classify the intent/vibe of each message into exactly one of these: 'general', 'love', 'confidence', 'sadness', 'joy', 'gratitude', 'curiosity'.\n\n" .
                      "Respond strictly in JSON array format containing the evaluation of each message. Each item in the array must follow this exact structure:\n" .
                      "{\n" .
                      "    \"id\": the numeric ID of the message,\n" .
                      "    \"is_harmful\": true or false,\n" .
                      "    \"reason\": \"A short explanation of why the message was flagged, or null if safe.\",\n" .
                      "    \"intent\": \"general\" or \"love\" or \"confidence\" or \"sadness\" or \"joy\" or \"gratitude\" or \"curiosity\"\n" .
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
