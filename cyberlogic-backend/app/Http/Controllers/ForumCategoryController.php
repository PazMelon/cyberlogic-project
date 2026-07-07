<?php

namespace App\Http\Controllers;

use App\Models\ForumCategory;

class ForumCategoryController extends Controller
{
    /**
     * GET /api/forum/categories
     * Retrieve all forum categories ordered by sort_order.
     */
    public function index()
    {
        $categories = ForumCategory::orderBy('sort_order', 'asc')->get();

        return response()->json($categories);
    }
}
