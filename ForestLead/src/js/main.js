//burder menu 

$('.nav__button').click(function() {
	$('.nav__list').toggleClass('opened');
	$('.nav__button--burger').toggleClass('open');
})

$('.nav__list a').click(function() {
	$('.nav__list').removeClass('opened');
	$('.nav__button--burger').removeClass('open');
})


//плавная прокрутка

var $page = $('html, body');
$('a[href*="#"]').click(function() {
    $page.animate({
        scrollTop: $($.attr(this, 'href')).offset().top
    }, 600);
    return false;
});