// Closes the application when the tab closes.
$(window).unload(function() {
  $.ajax({
    type: "POST",
    url: "exit",
    async:false,
  });
});
