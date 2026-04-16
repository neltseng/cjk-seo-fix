<?php
if (!defined('ABSPATH')) {
    exit;
}

add_filter('rank_math/researches/tests', function ($tests, $type) {
    unset($tests['titleSentiment']);
    return $tests;
}, 20, 2);

add_filter('rank_math/metabox/power_words', function ($words, $locale) {
    if ($locale !== 'zh') {
        return $words;
    }
    return include CJK_SEO_FIX_PATH . 'assets/data/power-words-zh.php';
}, 10, 2);

add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook, ['post.php', 'post-new.php', 'term.php'], true)) {
        return;
    }

    $config = apply_filters('cjk_seo_fix/rank_math/config', [
        'boundaries' => [
            'recommended'      => ['boundary' => 1500, 'score' => 8],
            'belowRecommended' => ['boundary' => 1000, 'score' => 5],
            'medium'           => ['boundary' => 600,  'score' => 4],
            'belowMedium'      => ['boundary' => 400,  'score' => 3],
            'low'              => ['boundary' => 200,  'score' => 2],
        ],
    ]);

    wp_enqueue_script(
        'cjk-seo-fix-rank-math',
        CJK_SEO_FIX_URL . 'assets/js/rank-math-cjk.js',
        ['rank-math-analyzer'],
        CJK_SEO_FIX_VERSION,
        true
    );
    wp_localize_script('cjk-seo-fix-rank-math', 'cjkSeoFixRM', $config);
});
