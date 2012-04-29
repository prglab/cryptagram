(function( $ ){
  // Simple wrapper around jQuery animate to simplify animating progress from your app
  // Inputs: Progress as a percent, Callback
  // TODO: Add options and jQuery UI support.
  $.fn.animateProgress = function(progress, callback) {
    return this.each(function() {
      $(this).animate({
        width: progress+'%'
      }, {
        duration: 1100,

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

          if (Math.ceil(progress) == 100) {
            labelEl.text('Completed');
            setTimeout(function() {
              labelEl.fadeOut();
            }, 1000);
          }else{
            valueEl.text(Math.ceil(progress) + '%');
          }
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
								child_progress_span.value = path;

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

				paths_progress = $.parseJSON(data);
				for (path in paths_progress) {
						$('#' + path + '_progress').animateProgress(paths_progress[path]);
				}

		}.bind(this));
		t = setTimeout("postStatus(false);", 1000);
}

