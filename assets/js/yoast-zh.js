(function () {
  'use strict';

  var analysis = window.yoast.analysis;
  var languageProcessing = analysis.languageProcessing;
  var AbstractResearcher = languageProcessing.AbstractResearcher;
  var baseStemmer = languageProcessing.baseStemmer;

  var config = window.cjkSeoFixYoast || {};
  var CJK_CHAR = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]/;
  function buildPunctuationRegex() {
    var extra =
      '\uff0c\u3002\uff01\uff1f\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011\u300a\u300b\u2014\u2026\u00b7';
    var base = '\\-,.!?;:\'"()\\[\\]{}<>\\/\\\\@#$%^&*+=|~`';
    return new RegExp('[' + extra + base + ']', 'g');
  }

  var punctuationRegex = buildPunctuationRegex();

  function customCountLength(text) {
    if (!text) return 0;
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/\s+/g, '');
    text = text.replace(punctuationRegex, '');
    return text.length;
  }

  function splitIntoTokensCustom(text) {
    if (!text) return [];
    var tokens = [];
    var current = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (CJK_CHAR.test(ch)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(ch);
      } else if (/\s/.test(ch)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  function matchWordCustomHelper(text, word) {
    if (!text || !word) return [];
    var matches = [];
    var lower = text.toLowerCase();
    var target = word.toLowerCase();
    var idx = 0;
    while ((idx = lower.indexOf(target, idx)) !== -1) {
      matches.push(text.substring(idx, idx + target.length));
      idx += target.length;
    }
    return matches;
  }

  function wordsCharacterCount(words) {
    if (!words || words.length === 0) return 0;
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      total += words[i].length;
    }
    return total;
  }

  function customGetStemmer() {
    return baseStemmer;
  }

  function wordCountInText(paper) {
    var text = paper.getText();
    return { text: text, count: customCountLength(text), unit: 'character' };
  }

  function keyphraseLength(paper) {
    var kw = paper.getKeyword();
    return {
      keyphraseLength: wordsCharacterCount(splitIntoTokensCustom(kw)),
      functionWords: []
    };
  }

  function morphology(paper) {
    var kw = paper.getKeyword().toLowerCase().trim().replace(/\s/g, '');
    var synonyms = paper.getSynonyms()
      ? paper
          .getSynonyms()
          .toLowerCase()
          .trim()
          .split(',')
          .map(function (s) {
            return s.trim().replace(/\s/g, '');
          })
          .filter(Boolean)
      : [];
    return {
      keyphraseForms: [[kw]],
      synonymsForms: synonyms.map(function (s) {
        return [[s]];
      })
    };
  }

  function findKeyphraseInSEOTitle(paper) {
    var title = paper.getTitle();
    var kw = paper.getKeyword();
    var result = {
      allWordsFound: false,
      position: -1,
      exactMatchKeyphrase: false
    };

    if (!title || !kw) return result;

    var lowerTitle = title.toLowerCase();
    var lowerKw = kw.toLowerCase().trim();
    var pos = lowerTitle.indexOf(lowerKw);

    if (pos !== -1) {
      result.allWordsFound = true;
      result.position = pos === 0 ? 'beginning' : 'elsewhere';
      result.exactMatchKeyphrase = true;
    }

    return result;
  }

  class ChineseResearcher extends AbstractResearcher {
    constructor(paper) {
      super(paper);

      delete this.defaultResearches.getFleschReadingScore;
      delete this.defaultResearches.getPassiveVoiceResult;
      delete this.defaultResearches.getSentenceBeginnings;
      delete this.defaultResearches.findTransitionWords;
      delete this.defaultResearches.functionWordsInKeyphrase;
      delete this.defaultResearches.keywordCountInSlug;

      Object.assign(this.defaultResearches, {
        wordCountInText: wordCountInText,
        keyphraseLength: keyphraseLength,
        morphology: morphology,
        findKeyphraseInSEOTitle: findKeyphraseInSEOTitle
      });

      Object.assign(this.config, {
        language: 'zh',
        countCharacters: true,
        functionWords: [],
        topicLength: {
          lengthCriteria: 7
        },
        textLength: config.textLength || {
          defaultAnalysis: {
            recommendedMinimum: 600,
            slightlyBelowMinimum: 500,
            belowMinimum: 400,
            veryFarBelowMinimum: 200
          },
          defaultCornerstone: {
            recommendedMinimum: 1800,
            slightlyBelowMinimum: 800,
            belowMinimum: 600,
            scores: { belowMinimum: -20, farBelowMinimum: -20 }
          },
          taxonomyAssessor: {
            recommendedMinimum: 60,
            slightlyBelowMinimum: 20,
            veryFarBelowMinimum: 1
          },
          productSEOAssessor: {
            recommendedMinimum: 400,
            slightlyBelowMinimum: 300,
            belowMinimum: 200,
            veryFarBelowMinimum: 100
          },
          productCornerstoneSEOAssessor: {
            recommendedMinimum: 800,
            slightlyBelowMinimum: 600,
            belowMinimum: 400,
            scores: { belowMinimum: -20, farBelowMinimum: -20 }
          },
          collectionSEOAssessor: {
            recommendedMinimum: 60,
            slightlyBelowMinimum: 20,
            veryFarBelowMinimum: 1
          },
          collectionCornerstoneSEOAssessor: {
            recommendedMinimum: 60,
            slightlyBelowMinimum: 20,
            veryFarBelowMinimum: 1
          }
        },
        paragraphLength: {
          defaultPageParams: { recommendedLength: 300, maximumRecommendedLength: 400 },
          productPageParams: { recommendedLength: 140, maximumRecommendedLength: 200 }
        },
        sentenceLength: {
          recommendedLength: config.sentenceLength || 40
        },
        assessmentApplicability: {
          transitionWords: 400,
          keyphraseDensity: 200
        },
        keyphraseLength: {
          defaultAnalysis: {
            parameters: { recommendedMaximum: 12, acceptableMaximum: 18 }
          },
          productPages: {
            parameters: {
              recommendedMinimum: 8,
              recommendedMaximum: 12,
              acceptableMaximum: 18,
              acceptableMinimum: 4
            }
          }
        },
        subheadingsTooLong: {
          defaultParameters: {
            parameters: {
              recommendedMaximumLength: config.subheadingLength || 600,
              slightlyTooMany: config.subheadingLength || 600,
              farTooMany: 700
            },
            applicableIfTextLongerThan: 600
          },
          cornerstoneParameters: {
            parameters: {
              recommendedMaximumLength: 500,
              slightlyTooMany: 500,
              farTooMany: 600
            },
            applicableIfTextLongerThan: 500
          }
        },
        metaDescriptionLength: {
          recommendedMaximumLength: 60,
          maximumLength: 80
        }
      });

      Object.assign(this.helpers, {
        customGetStemmer: customGetStemmer,
        customCountLength: customCountLength,
        matchWordCustomHelper: matchWordCustomHelper,
        getWordsCustomHelper: splitIntoTokensCustom,
        getContentWords: splitIntoTokensCustom,
        wordsCharacterCount: wordsCharacterCount,
        splitIntoTokensCustom: splitIntoTokensCustom
      });
    }
  }

  var module = { default: ChineseResearcher };
  (window.yoast = window.yoast || {}).Researcher = module;
})();
