// Closes the application when the tab closes.

// submitted is a global variable that controls whether a window closing should
// kill the backend program.
var submitted = false;

$(window).unload(function() {
  if (!submitted) {
    $.ajax({
      type: "POST",
      url: "exit",
      async:false,
    });
  }
});
