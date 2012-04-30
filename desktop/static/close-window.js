// Closes the application when the tab closes.
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
