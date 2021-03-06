/*
 * Lazy Load - jQuery plugin for lazy loading images
 *
 * Forked and modified for retina, mobile and many other options by faction23.
 *
 * Copyright (c) 2007-2013 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/lazyload
 *
 * Version:  1.9.3
 *
 */

(function( $, window, document, undefined ) {

	var $window = $( window ),
		retina = false,
		v_width = 0,
		resize_timer;

	$.fn.lazyload = function( options ) {

		var elements = this,
			$container,
			settings = {
				anm_duration     : 400,
				anm_easing       : "linear",
				anm_fade         : true,
				appear           : null,
				container        : window,
				data_attribute   : "src",
				data_json        : "img-sizes",
				event            : "scroll",
				failure_limit    : 0,
				filename_sep     : "",
				load             : null,
				mobile_breakpoint: 768,
				placeholder      : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC",
				resize_debounce  : 200,
				resize_event     : "resize",
				responsive       : true,
				skip_invisible   : true,
				shim             : location.protocol + "//" + location.host + "/1x1.png",
				threshold        : 0,
				use_mobile       : false,
				use_json         : false,
				use_retina       : true
			};

		if ( settings.anm_fade ) {
			elements.css( "opacity", "0" );
		}

		function update() {

			var counter = 0;

			v_width = $( window ).width();
			retina = (isRetina()) ? true : false;

			elements
				.each( function() {

					var $this = $( this );

					if ( settings.skip_invisible && !$this.is( ":visible" ) ) {
						return;
					}

					if ( $.abovethetop( this, settings ) || $.leftofbegin( this, settings ) ) {
						/* Nothing. */
					}
					else if ( !$.belowthefold( this, settings ) && !$.rightoffold( this, settings ) ) {
						$this.trigger( "appear" );
						/* if we found an image we'll load, reset the counter */
						counter = 0;
					}
					else {
						if ( ++counter > settings.failure_limit ) {
							return false;
						}
					}
				} );

		}

		function convertToB64( image, callback ) {

			var canvas = document.createElement( "CANVAS" ),
				ctx = canvas.getContext( "2d" ),
				img = new Image();

			img.crossOrigin = "Anonymous";

			img.onload = function() {
				var dataURL;
				canvas.height = image.h;
				canvas.width = image.w;
				ctx.drawImage( img, 0, 0 );
				dataURL = canvas.toDataURL( "image/png" );
				callback.call( this, dataURL );
				canvas = null;
			};

			img.src = settings.shim;
		}

		function hasAttr( self, name ) {

			var attr = self.attr( name );
			return (typeof attr !== typeof undefined && attr !== false);

		}

		function isRetina() {

			var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
            (min--moz-device-pixel-ratio: 1.5),\
            (-o-min-device-pixel-ratio: 3/2),\
            (min-resolution: 1.5dppx)";

			return window.devicePixelRatio > 1.5 || (window.matchMedia && window.matchMedia( mediaQuery ).matches);

		}

		function getSrc( $self ) {

			var img_src = $self.attr( "data-" + settings.data_attribute );

			if ( settings.use_json ) {

				var sizes = $self.data( settings.data_json ),
					json_key = "";

				if ( settings.use_mobile && v_width < settings.mobile_breakpoint ) {
					json_key = (settings.use_retina && retina) ? "m2x" : "m";
				}
				else {
					json_key = (settings.use_retina && retina) ? "d2x" : "d";
				}

				if ( sizes.hasOwnProperty( json_key ) ) {
					img_src = img_src.replace( /(\.[\w\d_-]+)$/i, settings.filename_sep + sizes[json_key] + "$1" );
				}

			}
			else {

				if ( settings.use_mobile && v_width < settings.mobile_breakpoint && hasAttr( $self, "data-mobile-src" ) ) {
					img_src = $self.attr( "data-mobile-src" );
				}

				if ( settings.use_mobile && v_width >= settings.mobile_breakpoint && hasAttr( $self, "data-retina-src" ) ) {
					img_src = $self.attr( "data-retina-src" );
				}

			}

			return img_src;

		}

		if ( options ) {
			/* Maintain BC for a couple of versions. */
			if ( undefined !== options.failurelimit ) {
				options.failure_limit = options.failurelimit;
				delete options.failurelimit;
			}
			if ( undefined !== options.effectspeed ) {
				options.effect_speed = options.effectspeed;
				delete options.effectspeed;
			}

			$.extend( settings, options );
		}

		/* Cache container as jQuery as object. */
		$container = (settings.container === undefined ||
		settings.container === window) ? $window : $( settings.container );

		/* Fire one scroll event per scroll. Not one scroll event per image. */
		if ( 0 === settings.event.indexOf( "scroll" ) ) {
			$container.bind( settings.event, function() {
				return update();
			} );
		}

		this.each( function() {

			var self = this,
				$self = $( self );

			self.loaded = false;

			/* If no src attribute given use data:uri. */
			if ( $self.attr( "src" ) === undefined || $self.attr( "src" ) === false ) {
				if ( $self.is( "img" ) ) {
					if (
						settings.responsive &&
						( hasAttr( $self, "width" ) && hasAttr( $self, "height" ) ) ||
						( hasAttr( $self, "data-width" ) && hasAttr( $self, "data-height" ) )
					) {
						var image = {};

						image.w = hasAttr( $self, "width" ) ? $self.attr( "width" ) : $self.attr( "data-width" );
						image.h = hasAttr( $self, "height" ) ? $self.attr( "height" ) : $self.attr( "data-height" );

						convertToB64( image, function( b64_image ) {
							if ( $self.attr( "src" ) === undefined || $self.attr( "src" ) === false ) {
								$self.attr( "src", b64_image );
							}
						} );

					}
					else {
						$self.attr( "src", settings.placeholder );
					}
				}
			}

			///* When appear is triggered load original image. */
			$self
				.one( "appear", function() {
					if ( !this.loaded ) {
						if ( settings.appear ) {
							var elements_left = elements.length;
							settings.appear.call( self, elements_left, settings );
						}
						$( "<img />" )
							.bind( "load", function() {

								var original = getSrc( $self );

								if ( !settings.anm_fade ) {
									elements.css( "opacity", "0" );
								}

								if ( $self.is( "img" ) ) {
									$self.attr( "src", original );
								}
								else {
									$self.css( "background-image", "url('" + original + "')" );
								}

								if ( settings.anm_fade ) {
									$self
										.animate( {
											opacity: "1"
										},
										settings.anm_duration,
										settings.anm_easing
									);
								}
								else {
									$self.css( "opacity", "1" );
								}

								self.loaded = true;

								/* Remove image from array so it is not looped next time. */
								var temp = $.grep( elements, function( element ) {
									return !element.loaded;
								} );
								elements = $( temp );

								if ( settings.load ) {
									var elements_left = elements.length;
									settings.load.call( self, elements_left, settings );
								}
							} )
							.attr( "src", getSrc( $self ) );
					}
				} );

			/* When wanted event is triggered load original image */
			/* by triggering appear.                              */
			if ( 0 !== settings.event.indexOf( "scroll" ) ) {
				$self.bind( settings.event, function() {
					if ( !self.loaded ) {
						$self.trigger( "appear" );
					}
				} );
			}
		} );

		/* Check if something appears when window is resized. */
		$window
			.bind( settings.resize_event, function() {
				clearTimeout( resize_timer );
				resize_timer = setTimeout( update, settings.resize_debounce );
			} );

		/* With IOS5 force loading images when navigating with back button. */
		/* Non optimal workaround. */
		if ( (/(?:iphone|ipod|ipad).*os 5/gi).test( navigator.appVersion ) ) {
			$window.bind( "pageshow", function( event ) {
				if ( event.originalEvent && event.originalEvent.persisted ) {
					elements.each( function() {
						$( this ).trigger( "appear" );
					} );
				}
			} );
		}

		/* Force initial check if images should appear. */
		$( document ).ready( function() {
			update();
		} );

		return this;
	};

	/* Convenience methods in jQuery namespace.           */
	/* Use as  $.belowthefold(element, {threshold : 100, container : window}) */

	$.belowthefold = function( element, settings ) {
		var fold;

		if ( settings.container === undefined || settings.container === window ) {
			fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
		}
		else {
			fold = $( settings.container ).offset().top + $( settings.container ).height();
		}

		return fold <= $( element ).offset().top - settings.threshold;
	};

	$.rightoffold = function( element, settings ) {
		var fold;

		if ( settings.container === undefined || settings.container === window ) {
			fold = $window.width() + $window.scrollLeft();
		}
		else {
			fold = $( settings.container ).offset().left + $( settings.container ).width();
		}

		return fold <= $( element ).offset().left - settings.threshold;
	};

	$.abovethetop = function( element, settings ) {
		var fold;

		if ( settings.container === undefined || settings.container === window ) {
			fold = $window.scrollTop();
		}
		else {
			fold = $( settings.container ).offset().top;
		}

		return fold >= $( element ).offset().top + settings.threshold + $( element ).height();
	};

	$.leftofbegin = function( element, settings ) {
		var fold;

		if ( settings.container === undefined || settings.container === window ) {
			fold = $window.scrollLeft();
		}
		else {
			fold = $( settings.container ).offset().left;
		}

		return fold >= $( element ).offset().left + settings.threshold + $( element ).width();
	};

	$.inviewport = function( element, settings ) {
		return !$.rightoffold( element, settings ) && !$.leftofbegin( element, settings ) && !$.belowthefold( element, settings ) && !$.abovethetop( element, settings );
	};

	/* Custom selectors for your convenience.   */
	/* Use as $("img:below-the-fold").something() or */
	/* $("img").filter(":below-the-fold").something() which is faster */

	$.extend( $.expr[":"], {
		"below-the-fold" : function( a ) {
			return $.belowthefold( a, {threshold: 0} );
		},
		"above-the-top"  : function( a ) {
			return !$.belowthefold( a, {threshold: 0} );
		},
		"right-of-screen": function( a ) {
			return $.rightoffold( a, {threshold: 0} );
		},
		"left-of-screen" : function( a ) {
			return !$.rightoffold( a, {threshold: 0} );
		},
		"in-viewport"    : function( a ) {
			return $.inviewport( a, {threshold: 0} );
		},
		/* Maintain BC for couple of versions. */
		"above-the-fold" : function( a ) {
			return !$.belowthefold( a, {threshold: 0} );
		},
		"right-of-fold"  : function( a ) {
			return $.rightoffold( a, {threshold: 0} );
		},
		"left-of-fold"   : function( a ) {
			return !$.rightoffold( a, {threshold: 0} );
		}
	} );

})( jQuery, window, document );
