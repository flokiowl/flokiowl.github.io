$('.projects__list').masonry({
  // options
  itemSelector: '.projects__item',
  // columnWidth: 100
});

if (window.width < 768) {

}


//tabs


$('.projects__tab-btn').click(function() {
	$('.projects__tab-btn').removeClass('active');
    $(this).addClass('active');

    if ($(this).hasClass('all')) {
    	$('.projects__item').css({
    		'opacity' : 1,
    		'visibility' : 'visible'
    	})
    }
    if ($(this).hasClass('web-design')) {
    	$('.projects__item[data-name="graphic"]').css({
    		'opacity' : 1,
    		'visibility' : 'visible'
    	})
    	$('.projects__item:not([data-name="graphic"])').css({
    		'opacity' : 0,
    		'visibility' : 'hidden'
    	})
    }
    if ($(this).hasClass('mobile-app')) {
    	$('.projects__item[data-name="mobile"]').css({
    		'opacity' : 1,
    		'visibility' : 'visible'
    	})
    	$('.projects__item:not([data-name="mobile"])').css({
    		'opacity' : 0,
    		'visibility' : 'hidden'
    	})
    }
    if ($(this).hasClass('illustration')) {
    	$('.projects__item[data-name="illustration"]').css({
    		'opacity' : 1,
    		'visibility' : 'visible'
    	})
    	$('.projects__item:not([data-name="illustration"])').css({
    		'opacity' : 0,
    		'visibility' : 'hidden'
    	})
    }
    if ($(this).hasClass('photography')) {
    	$('.projects__item[data-name="photography"]').css({
    		'opacity' : 1,
    		'visibility' : 'visible',
    	})
    	$('.projects__item:not([data-name="photography"])').css({
    		'opacity' : 0,
    		'visibility' : 'hidden',
    	})
    }
});