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
      submitted = true;
      $(form).ajaxSubmit();
    }
  });
});
