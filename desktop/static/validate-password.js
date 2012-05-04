// Validate password.
$(document).ready(function() {
  $("#input").validate({
    rules: {
      password: "required",
      password_again: {
        equalTo: "#password"
      }
    },
    submitHandler: function(form) {
      // Global variable that disables the window.unload event that kills the
      // backend program.
      submitted = true;
      $(form).ajaxSubmit();
    }
  });
});
