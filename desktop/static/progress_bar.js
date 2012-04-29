(function( $ ){
  // Simple wrapper around jQuery animate to simplify animating progress from your app
  // Inputs: Progress as a percent, Callback
  // TODO: Add options and jQuery UI support.
  $.fn.animateProgress = function(progress, callback) {
    return this.each(function() {
      $(this).animate({
        width: progress+'%'
      }, {
        duration: 1500,

        // swing or linear
        easing: 'linear',

        // this gets called every step of the animation, and updates the label
        step: function( progress ){
          var labelEl = $('.ui-label', this),
              valueEl = $('.value', labelEl);

          if (Math.ceil(progress) < 20 && $('.ui-label', this).is(":visible")) {
            labelEl.hide();
          }else{
            if (labelEl.is(":hidden")) {
              labelEl.fadeIn();
            };
          }

          // if (Math.ceil(progress) == 100) {
          //   labelEl.text('Completed');
          //   setTimeout(function() {
          //     labelEl.fadeOut();
          //   }, 1000);
          // } else {
            valueEl.text(Math.ceil(progress) + '%');
          // }
        },
        complete: function(scope, i, elem) {
          if (callback) {
            callback.call(this, i, elem );
          };
        }
      });
    });
  };
})( jQuery );

function postStatus(first_time) {
		var complete = false;
		$.post("status", function(data) {
				if (first_time) {
						console.log(data);
						console.log("postStatus first_time triggered");
						var pb_div = document.getElementById("progress_bars");

						paths_progress = $.parseJSON(data);
						for (path in paths_progress) {
								console.log(path);
								var child = document.createElement("div");
								child.id = path;

								var child_progress = document.createElement("div");
								child_progress.id = path + '_progress';

								var child_progress_span = document.createElement("span");
								child_progress_span.id = path + '_progress_span';
								child_progress_span.innerHTML = path;

								child_progress.appendChild(child_progress_span);
								child.appendChild(child_progress);
								pb_div.appendChild(child);
						}

						for (path in paths_progress) {
								$('#' + path).addClass("ui-progress-bar ui-container transition");
								$('#' + path + '_progress').addClass("ui-progress");
								$('#' + path + '_progress').css("width","0%");
								$('#' + path + '_progress_span').addClass("ui-label");
						}
						return false;
				}

				var callback_complete = true;
				paths_progress = $.parseJSON(data);
				for (path in paths_progress) {
						var progress = paths_progress[path];
						if (progress < 100) {
								callback_complete = false;
						}
						$('#' + path + '_progress').animateProgress(progress);
				}

				if (callback_complete) {
						// Disable timer firing in a loop.
						clearTimeout(progress_bar_timer);

						// Reveal to the user how to quit.
						show_exit();
				}

		}.bind(this));

		progress_bar_timer = setTimeout("postStatus(false);", 1500);
}

function show_exit() {
		var exit = document.getElementById('exit');
		exit.innerHTML = '<form name="quitform" action="exit" method="get"><input type="submit" value="Exit" /></form>';
		return false;
}
