(function ($) {
var o = $('.counter__number');
var cc = 1;

if (o.length > 0) {

    $(window).scroll(function(){
        var targetPos = o.offset().top;
        var winHeight = $(window).height();
        var scrollToElem = targetPos - winHeight;
        var winScrollTop = $(this).scrollTop();

        if (winScrollTop > scrollToElem) {
            if (cc < 2) {
                cc = cc + 2;
                $(document).ready(function () {
                    $(o).countTo();
                });
            }
        }
    });
}
})(jQuery);

