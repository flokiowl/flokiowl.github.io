$('.header__show-form').click(function() {
	$('.overlay').toggleClass('overlay-active');
	$('.form-block').toggleClass('form-active');
})
$('.overlay').click(function() {
	$('.overlay').removeClass('overlay-active');
	$('.form-block').removeClass('form-active');
})