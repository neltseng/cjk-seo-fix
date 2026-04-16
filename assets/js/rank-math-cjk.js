(function () {
  'use strict';

  var CJK = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
  var config = window.cjkSeoFixRM || {};

  function countCJK(text) {
    return (String(text).match(CJK) || []).length;
  }

  function countNonCJKWords(text) {
    return String(text).replace(CJK, ' ').split(/\s+/).filter(Boolean).length;
  }

  function getContent() {
    var el = document.getElementById('content');
    if (el && el.value) return el.value;
    try {
      return wp.data.select('core/editor').getEditedPostContent();
    } catch (e) {
      return '';
    }
  }

  function getKeyword() {
    try {
      var kw = wp.data.select('rank-math').getSelectedKeyword();
      if (kw && kw.data && kw.data.value) return kw.data.value;
    } catch (e) {}
    try {
      var kws = wp.data.select('rank-math').getKeywords();
      if (kws && kws[0]) return kws[0];
      if (typeof kws === 'string' && kws) return kws.split(',')[0].trim();
    } catch (e) {}
    var el = document.getElementById('rank_math_focus_keyword');
    if (el && el.value) return el.value;
    var rkInput = document.querySelector('.rank-math-focus-keyword input[type="text"]');
    if (rkInput && rkInput.value) return rkInput.value;
    var tag = document.querySelector('.rank-math-focus-keyword .rank-math-keyword');
    if (tag) return tag.textContent.trim();
    return '';
  }

  function resolveText(paper) {
    var text = (paper && typeof paper.getText === 'function') ? paper.getText() : '';
    return (!text || countCJK(text) === 0) ? getContent() : text;
  }

  function cjkWordCount(text, origFn, paper) {
    var cjk = countCJK(text);
    if (cjk > 0) return cjk + countNonCJKWords(text);
    return typeof origFn === 'function' ? origFn(paper) : 0;
  }

  function cjkGetWords(text, origFn, paper) {
    var cjk = countCJK(text);
    if (cjk > 0) {
      var chars = text.match(CJK) || [];
      var nonCjk = text.replace(CJK, ' ').split(/\s+/).filter(Boolean);
      return chars.concat(nonCjk);
    }
    return origFn(paper);
  }

  function patchResearcher() {
    var RM = window.rankMathAnalyzer;
    if (!RM || !RM.Researcher) return false;

    var proto = RM.Researcher.prototype;
    var origGetResearches = proto.getResearches;

    proto.getResearches = function () {
      var r = origGetResearches.call(this);
      if (r._cjkPatched) return r;

      var origWC = r.wordCount;
      var origGW = r.getWords;

      r.wordCount = function (paper) {
        return cjkWordCount(resolveText(paper), origWC, paper);
      };

      if (typeof origGW === 'function') {
        r.getWords = function (paper) {
          return cjkGetWords(resolveText(paper), origGW, paper);
        };
      }

      r._cjkPatched = true;
      return r;
    };

    return true;
  }

  function hookFilters() {
    if (!window.wp || !wp.hooks) return;

    wp.hooks.addFilter('rankMath_analysis_keywordDensity', 'cjk-seo-fix', function (density) {
      var content = getContent();
      var cjk = countCJK(content);
      if (cjk === 0) return density;

      var kw = getKeyword();
      if (!kw) return density;

      var total = cjk + countNonCJKWords(content);
      try {
        var re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        var matches = (content.match(re) || []).length;
        return parseFloat((matches * kw.length / total * 100).toFixed(2));
      } catch (e) {
        return density;
      }
    });

    wp.hooks.addFilter('rankMath_analysis_contentLength_boundaries', 'cjk-seo-fix', function () {
      return config.boundaries || {
        recommended:      { boundary: 1500, score: 8 },
        belowRecommended: { boundary: 1000, score: 5 },
        medium:           { boundary: 600,  score: 4 },
        belowMedium:      { boundary: 400,  score: 3 },
        low:              { boundary: 200,  score: 2 }
      };
    });
  }

  hookFilters();

  var attempts = 0;
  var poll = setInterval(function () {
    if (++attempts > 30) {
      clearInterval(poll);
      console.warn('[CJK SEO Fix] Rank Math Researcher not found after 15s, CJK patch not applied.');
      return;
    }
    if (window.rankMathAnalyzer && window.rankMathAnalyzer.Researcher) {
      clearInterval(poll);
      if (patchResearcher()) {
        try {
          if (window.rankMathEditor && window.rankMathEditor.assessor) {
            window.rankMathEditor.assessor.refresh();
          }
        } catch (e) {}
      } else {
        console.warn('[CJK SEO Fix] Rank Math Researcher patch failed.');
      }
    }
  }, 500);
})();
