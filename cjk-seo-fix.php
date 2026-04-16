<?php
/**
 * Plugin Name: CJK SEO Fix
 * Description: 修正 Rank Math 和 Yoast SEO 對中文（CJK）內容的字數計算和 SEO 評分
 * Version: 1.0.0
 * Author: Nelll
 * Author URI: https://cloudwp.pro
 * License: GPL-2.0-or-later
 * Text Domain: cjk-seo-fix
 * Requires PHP: 7.4
 * Requires at least: 6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CJK_SEO_FIX_VERSION', '1.0.0');
define('CJK_SEO_FIX_PATH', plugin_dir_path(__FILE__));
define('CJK_SEO_FIX_URL', plugin_dir_url(__FILE__));

define('CJK_SEO_FIX_RM_MIN', '1.0.230');
define('CJK_SEO_FIX_RM_MAX', '1.0.267');
define('CJK_SEO_FIX_YOAST_MIN', '23.0');
define('CJK_SEO_FIX_YOAST_MAX', '27.3');

function cjk_seo_fix_is_chinese() {
    if (function_exists('apply_filters')) {
        $wpml_lang = apply_filters('wpml_current_language', null);
        if ($wpml_lang !== null) {
            return $wpml_lang === 'zh' || strpos($wpml_lang, 'zh') === 0;
        }
    }

    if (function_exists('pll_current_language')) {
        $pll_lang = pll_current_language('locale');
        if ($pll_lang) {
            return strpos($pll_lang, 'zh') === 0;
        }
    }

    return substr(get_locale(), 0, 2) === 'zh';
}

function cjk_seo_fix_load_module($version_const, $min, $max, $include, $label) {
    if (!defined($version_const)) {
        return;
    }
    $ver = constant($version_const);
    if (version_compare($ver, $min, '>=') && version_compare($ver, $max, '<=')) {
        require_once CJK_SEO_FIX_PATH . $include;
        return;
    }
    add_action('admin_notices', function () use ($ver, $min, $max, $label) {
        printf(
            '<div class="notice notice-warning"><p><strong>CJK SEO Fix</strong>: %s %s 不在已測試範圍（%s – %s），中文修正已停用。</p></div>',
            esc_html($label),
            esc_html($ver),
            esc_html($min),
            esc_html($max)
        );
    });
}

function cjk_seo_fix_count_words($content) {
    $content = wp_strip_all_tags($content);
    $cjk = preg_match_all('/[\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]/u', $content);
    if ($cjk > 0) {
        $non_cjk = preg_replace('/[\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]/u', '', $content);
        return $cjk + str_word_count($non_cjk);
    }
    return str_word_count($content);
}

if (cjk_seo_fix_is_chinese() && defined('WPSEO_VERSION')) {
    add_filter('wpseo_schema_article', function ($data) {
        if (!isset($data['wordCount'])) {
            return $data;
        }
        $post = get_post();
        if (!$post) {
            return $data;
        }
        $count = cjk_seo_fix_count_words($post->post_content);
        if ($count > 0) {
            $data['wordCount'] = $count;
        }
        return $data;
    });

    add_filter('wpseo_enhanced_slack_data', function ($data) {
        $post = get_post();
        if (!$post) {
            return $data;
        }
        $count = cjk_seo_fix_count_words($post->post_content);
        if ($count === 0) {
            return $data;
        }
        $wpm = apply_filters('cjk_seo_fix/reading_speed', 400);
        $minutes = max(1, round($count / $wpm));
        $format = apply_filters('cjk_seo_fix/reading_time_format', __('%d min read', 'cjk-seo-fix'));
        foreach ($data as $key => $_) {
            if (stripos($key, 'reading') !== false || stripos($key, 'time') !== false) {
                $data[$key] = sprintf($format, $minutes);
                break;
            }
        }
        return $data;
    });
}

add_action('admin_init', function () {
    if (!cjk_seo_fix_is_chinese()) {
        return;
    }
    cjk_seo_fix_load_module('RANK_MATH_VERSION', CJK_SEO_FIX_RM_MIN, CJK_SEO_FIX_RM_MAX, 'includes/rank-math.php', 'Rank Math');
    cjk_seo_fix_load_module('WPSEO_VERSION', CJK_SEO_FIX_YOAST_MIN, CJK_SEO_FIX_YOAST_MAX, 'includes/yoast.php', 'Yoast SEO');
});
