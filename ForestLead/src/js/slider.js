var slideNow = 1;
var slideCount = $('#slidewrapper').children().length;
var slideInterval = 30000;
var navBtnId = 0;
var translateWidth = 0;
var i = 0;

$(document).ready(function() {
    // var switchInterval = setInterval(nextSlide, slideInterval);

    // $('#viewport').hover(function() {
    //     clearInterval(switchInterval);
    // }, function() {
    //     switchInterval = setInterval(nextSlide, slideInterval);
    // });

    $('#next-btn').click(function() {
        nextSlide();
        var navBtn = $('.slide-nav-btn');
        i++;
        if (i > 4) {
            i = 0;
        }
        $('.slide-nav-btn').removeClass('current');
        $(navBtn[i]).addClass('current');
    });


    $('#prev-btn').click(function() {
        prevSlide();
        var navBtn = $('.slide-nav-btn');
        i--;
        if (i < 0) {
            i = 4;
        }
        $('.slide-nav-btn').removeClass('current');
        $(navBtn[i]).addClass('current');
    });

    $('.slide-nav-btn').click(function() {
        navBtnId = $(this).index();

        if (navBtnId + 1 != slideNow) {
            translateWidth = -$('#viewport').width() * (navBtnId);
            $('.slide-nav-btn').removeClass('current');
            $(this).addClass('current');
            $('#slidewrapper').css({
                'transform': 'translate(' + translateWidth + 'px, 0)',
                '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
                '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
            });
            slideNow = navBtnId + 1;
        }
    });
});


function nextSlide() {
    if (slideNow == slideCount || slideNow <= 0 || slideNow > slideCount) {
        $('#slidewrapper').css('transform', 'translate(0, 0)');
        slideNow = 1;
    } else {
        translateWidth = -$('#viewport').width() * (slideNow);
        $('#slidewrapper').css({
            'transform': 'translate(' + translateWidth + 'px, 0)',
            '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
            '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
        });
        slideNow++;
    }
}

function prevSlide() {
    if (slideNow == 1 || slideNow <= 0 || slideNow > slideCount) {
        translateWidth = -$('#viewport').width() * (slideCount - 1);
        $('#slidewrapper').css({
            'transform': 'translate(' + translateWidth + 'px, 0)',
            '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
            '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
        });
        slideNow = slideCount;
    } else {
        translateWidth = -$('#viewport').width() * (slideNow - 2);
        $('#slidewrapper').css({
            'transform': 'translate(' + translateWidth + 'px, 0)',
            '-webkit-transform': 'translate(' + translateWidth + 'px, 0)',
            '-ms-transform': 'translate(' + translateWidth + 'px, 0)',
        });
        slideNow--;
    }
}


