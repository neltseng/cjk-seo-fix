<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook, ['post.php', 'post-new.php', 'term.php'], true)) {
        return;
    }

    wp_register_script(
        'cjk-seo-fix-yoast-zh',
        CJK_SEO_FIX_URL . 'assets/js/yoast-zh.js',
        ['yoast-seo-analysis-package'],
        CJK_SEO_FIX_VERSION,
        true
    );
    wp_enqueue_script('cjk-seo-fix-yoast-zh');

    $config = apply_filters('cjk_seo_fix/yoast/config', [
        'sentenceLength'   => 40,
        'subheadingLength' => 600,
    ]);
    wp_localize_script('cjk-seo-fix-yoast-zh', 'cjkSeoFixYoast', $config);
}, 5);

add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook, ['post.php', 'post-new.php', 'term.php'], true)) {
        return;
    }

    $zh_url = CJK_SEO_FIX_URL . 'assets/js/yoast-zh.js?ver=' . CJK_SEO_FIX_VERSION;

    $override_js = sprintf(
        'if(window.wpseoScriptData&&window.wpseoScriptData.analysis&&window.wpseoScriptData.analysis.worker&&window.wpseoScriptData.analysis.worker.dependencies){' .
        'window.wpseoScriptData.analysis.worker.dependencies["yoast-seo-default-language"]=%s;' .
        '}',
        wp_json_encode($zh_url)
    );

    wp_add_inline_script('yoast-seo-post-edit', $override_js, 'before');
    wp_add_inline_script('yoast-seo-post-edit-classic', $override_js, 'before');
    wp_add_inline_script('yoast-seo-term-edit', $override_js, 'before');
}, 20);
