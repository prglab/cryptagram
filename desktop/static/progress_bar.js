(function( $ ){
  // Simple wrapper around jQuery animate to simplify animating progress from your app
  // Inputs: Progress as a percent, Callback
  // TODO: Add options and jQuery UI support.
  $.fn.animateProgress = function(progress, callback) {
    return this.each(function() {
      $(this).animate({
        width: progress+'%'
      }, {
        duration: 750,

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

// Poll the backend for status of the files. Files can be in one of three
// states: queued, processing, finished. Finished files may either be success or
// failure.

var file_status = new Object();
file_status.queued = new Object();
file_status.processing = new Object();
file_status.finished = new Object();

function postStatus(first_time) {
	var complete = false;
	$.post("status", function(data) {
		console.log(data);

		var paths_progress = $.parseJSON(data);

		// Identify any transitions between the three states.
		for (path in paths_progress) {
			// Transitioned: processing --> finished.
			if ((paths_progress[path] == 100) && !(path in file_status.finished)) {
				console.log('processing --> finished: ' + path);
				delete file_status.processing[path];
				file_status.finished[path] = 0;
				continue;
			}

			// Transitioned: queued --> processing.
			if ((paths_progress[path] >= -100) && (paths_progress[path] < 100) &&
					!(path in file_status.processing)) {
				console.log('queued --> processing: ' + path);
				delete file_status.queued[path];
				file_status.processing[path] = 0;
				continue;
			}

			// If not in processing or finished, then queued. Add it if not already
			// there.
			if (!(path in file_status.processing) &&
					(!(path in file_status.finished)) &&
					(!(path in file_status.queued))) {
				file_status.queued[path] = 0;
			}
		}

		// For new queue items, add them to the visible queue list.
		for (path in file_status.queued) {
			if (0 == file_status.queued[path]) {
				++file_status.queued[path];

				var list_item = document.createElement("li");
				list_item.id = path;
				list_item.innerHTML = path;
				$("#queued_list").append(list_item);
			}
		}

		// For new finished items, remove them from the staging area and add them to
		// the finished list.
		for (path in file_status.finished) {
			if (0 == file_status.finished[path]) {
				++file_status.finished[path];
				console.log('Trying to remove from processing ' + path);

				$("section").remove("#" + path);

				var list_item = document.createElement("li");
				list_item.innerHTML = path;
				$("#finished_list").append(list_item);
			}
		}


		// For files that are being processed, we dequeue them and add them to the
		// processing area.
		for (path in file_status.processing) {
			if (0 == file_status.processing[path]) {
				// Increment value on file so we don't create another element.
				++file_status.processing[path];

				// Remove from queue.
				$("li").remove("#" + path);

				// Create new progress bar.
				var pb_div = document.getElementById("stage");
        var section = document.createElement("section");
				section.id = path;
				var child = document.createElement("div");
				child.id = path + '_progress_bar';
				var child_progress = document.createElement("div");
				child_progress.id = path + '_progress';
				var child_progress_span = document.createElement("span");
				child_progress_span.id = path + '_progress_span';
				child_progress_span.innerHTML = path;
				child_progress.appendChild(child_progress_span);
				child.appendChild(child_progress);
        section.appendChild(child)

				pb_div.insertBefore(section, pb_div.firstChild);

				$('#' + path + '_progress_bar').addClass("ui-progress-bar ui-container");
				$('#' + path + '_progress').addClass("ui-progress");
				$('section').addClass("work");
				$('#' + path + '_progress').css("width","0%");
				$('#' + path + '_progress_span').addClass("ui-label");
			}
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

	progress_bar_timer = setTimeout("postStatus(false);", 750);
}

function show_exit() {
	var exit = document.getElementById('exit');
	exit.innerHTML = '<form name="quitform" action="exit" method="get"><input type="submit" value="Exit" /></form>';
	return false;
}
