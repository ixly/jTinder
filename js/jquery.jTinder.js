/*
 * jTinder v.1.0.0
 * https://github.com/do-web/jTinder
 * Requires jQuery 1.7+, jQuery transform2d
 *
 * Copyright (c) 2014, Dominik Weber
 * Licensed under GPL Version 2.
 * https://github.com/do-web/jTinder/blob/master/LICENSE
 */
;(function ($, window, document, undefined) {
  var pluginName = "jTinder",
    defaults = {
      onDislike: null,
      onLike: null,
      animationRevertSpeed: 200,
      animationSpeed: 400,
      threshold: 1,
      likeSelector: '.like',
      dislikeSelector: '.dislike',
      likeAllButtonSelector: '.like-all',
      returnPanelSelector: '.return-button'
    };

  var container = null;
  var panes = null;
  var $that = null;
  var xStart = 0;
  var yStart = 0;
  var touchStart = false;
  var posX = 0, posY = 0, lastPosX = 0, lastPosY = 0, pane_width = 0, pane_count = 0;

  function Plugin(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init(element);
  }

  Plugin.prototype = {


    init: function (element) {
      container = $(">ul", element);
      panes = $(">ul>li", element);
      pane_width = container.width();
      pane_count = panes.length;
      $that = this;

      $(element).bind('touchstart mousedown', this.handler);
      $(element).bind('touchmove mousemove', this.handler);
      $(element).bind('touchend mouseup', this.handler);
      var time = 0;

      $($that.settings.likeAllButtonSelector).on('click', function() {
        $(container.find('li[data-swiped="none"]').get().reverse()).each(function(index, pane) {
          setTimeout(function() {
            $(pane).animate({"transform": "translate(" + (pane_width) + "px," + (posY + pane_width) + "px) rotate(60deg)"}, $that.settings.animationSpeed, function () {
              $(pane).hide();
            });
            if($that.settings.onLike) {
              $that.settings.onLike($(pane));
              $(pane).attr('data-swiped','like');
            }
          }, time += $that.settings.animationSpeed / 10);
        });
      });

      $($that.settings.returnPanelSelector).on('click', function() {
        var angle = Math.floor((Math.random() * 10) + 2) - 6;
        var prev_pane;
        if (container.find('li[data-swiped="none"]').length == 0) {
          prev_pane = container.find('li').first();
        } else {
          prev_pane = $that.nearestPanel().next();
        }
        prev_pane.show().animate({"transform": "translate(0px, 0px) rotate("+ angle +"deg)"});
        prev_pane.attr('data-swiped', 'none');
      });
    },

    nearestPanel: function () {
      return $(container.find('li[data-swiped="none"]').get().reverse()).first();
    },

    likeAction: function () {
      $that.nearestPanel().animate({"transform": "translate(" + (pane_width) + "px," + (posY + pane_width) + "px) rotate(60deg)"}, $that.settings.animationSpeed, function () {
        if($that.settings.onLike) {
            $that.settings.onLike($that.nearestPanel());
        }
        $(this).attr('data-swiped','like');
      });
    },

    dislikeAction: function() {
      $that.nearestPanel().animate({"transform": "translate(-" + (pane_width) + "px," + (posY + pane_width) + "px) rotate(-60deg)"}, $that.settings.animationSpeed, function () {
        if($that.settings.onDislike) {
            $that.settings.onDislike($that.nearestPanel());
        }
        $(this).attr('data-swiped','dislike');
      });
    },

    like: function() {
      $that.likeAction();
    },

    dislike: function() {
      $that.dislikeAction();
    },

    handler: function (ev) {
      ev.preventDefault();

      switch (ev.type) {
        case 'touchstart':
          if(touchStart === false) {
            touchStart = true;
            xStart = ev.originalEvent.touches[0].pageX;
            yStart = ev.originalEvent.touches[0].pageY;
          }
        case 'mousedown':
          if(touchStart === false) {
            touchStart = true;
            xStart = ev.pageX;
            yStart = ev.pageY;
          }
        case 'mousemove':
        case 'touchmove':
          if(touchStart === true) {
            var pageX = typeof ev.pageX == 'undefined' ? ev.originalEvent.touches[0].pageX : ev.pageX;
            var pageY = typeof ev.pageY == 'undefined' ? ev.originalEvent.touches[0].pageY : ev.pageY;
            var deltaX = parseInt(pageX) - parseInt(xStart);
            var deltaY = parseInt(pageY) - parseInt(yStart);
            var percent = ((100 / pane_width) * deltaX) / pane_count;
            posX = deltaX + lastPosX;
            posY = deltaY + lastPosY;

            $that.nearestPanel().css("transform", "translate(" + posX + "px," + posY + "px) rotate(" + (percent / 2) + "deg)");

            var opa = (Math.abs(deltaX) / $that.settings.threshold) / 100 + 0.2;
            if(opa > 1.0) {
              opa = 1.0;
            }
            if (posX >= 0) {
              $that.nearestPanel().find($that.settings.likeSelector).css('opacity', opa);
              $that.nearestPanel().find($that.settings.dislikeSelector).css('opacity', 0);
            } else if (posX < 0) {

              $that.nearestPanel().find($that.settings.dislikeSelector).css('opacity', opa);
              $that.nearestPanel().find($that.settings.likeSelector).css('opacity', 0);
            }
          }
          break;
        case 'mouseup':
        case 'touchend':
          touchStart = false;
          var pageX = (typeof ev.pageX == 'undefined') ? ev.originalEvent.changedTouches[0].pageX : ev.pageX;
          var pageY = (typeof ev.pageY == 'undefined') ? ev.originalEvent.changedTouches[0].pageY : ev.pageY;
          var deltaX = parseInt(pageX) - parseInt(xStart);
          var deltaY = parseInt(pageY) - parseInt(yStart);

          posX = deltaX + lastPosX;
          posY = deltaY + lastPosY;
          var opa = Math.abs((Math.abs(deltaX) / $that.settings.threshold) / 100 + 0.2);

          if (opa >= 1) {
            if (posX > 0) {
              $that.likeAction();
            } else {
              $that.dislikeAction();
            }
          } else {
            lastPosX = 0;
            lastPosY = 0;
            $that.nearestPanel().animate({"transform": "translate(0px,0px) rotate(0deg)"}, $that.settings.animationRevertSpeed);
            $that.nearestPanel().find($that.settings.likeSelector).animate({"opacity": 0}, $that.settings.animationRevertSpeed);
            $that.nearestPanel().find($that.settings.dislikeSelector).animate({"opacity": 0}, $that.settings.animationRevertSpeed);
          }

          break;
      }
    }
  };

  $.fn[ pluginName ] = function (options) {
    this.each(function () {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
      else if ($.isFunction(Plugin.prototype[options])) {
        $.data(this, 'plugin_' + pluginName)[options]();
        }
    });

    return this;
  };

})(jQuery, window, document);
