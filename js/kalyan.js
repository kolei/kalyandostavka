window.script_version = 48;
var tilda_form_id = 'form208707357';
var DEV_MODE = true;

class UserData {
    props = {
        _name: '',
        get name(){ 
            return decodeURIComponent( this._name );
        },
        set name(value){
            if(typeof value != 'undefined' && this._name != value){
                this._name = encodeURIComponent( value.trim() );
                $(`#${tilda_form_id} input[name='name']`).val(this.name);
                document.cookie = `name=${this._name}; max-age=31536000`;
            }
        },
        _phone: '',
        get phone(){ 
            return decodeURIComponent( this._phone );
        },
        set phone(value){
            if(typeof value != 'undefined' && this._phone != value){
                this._phone = encodeURIComponent( value.trim() );
                $(`#${tilda_form_id} input[name='phone']`).val(this.phone);
                document.cookie = `phone=${this._phone}; max-age=31536000`;
            }
        },
        _street: '',
        get street(){ 
            return decodeURIComponent( this._street ); 
        },
        set street(value){
            if(typeof value != 'undefined' && this._street != value){
                this._street = encodeURIComponent( value.trim() );
                $(`#${tilda_form_id} input[name='street']`).val(this.street);
                //document.cookie = `street=${this._street}; max-age=31536000`;
            }
        },
        _flat: '',
        get flat(){
            return decodeURIComponent( this._flat );
        },
        set flat(value){
            if(typeof value != 'undefined' && this._flat != value){
                this._flat = encodeURIComponent( value.trim() );
                $(`#${tilda_form_id} input[name='flat']`).val(this.flat);
                document.cookie = `flat=${this._flat}; max-age=31536000`;
            }
        },
        _coment: '',
        get coment(){
            return decodeURIComponent( this._coment );
        },
        set coment(value){
            if(this._coment != value){
                this._coment = encodeURIComponent( value.trim() );
                $(`#${tilda_form_id} textarea[name='coment']`).val(this.coment);
                document.cookie = `coment=${this._coment}; max-age=31536000`;
            }
        },
        _jsonAddress: null, // хранит JSON объект возвращаемый geocode, либо NULL, если адрес меняли вручную
        get jsonAddress(){
            return this._jsonAddress;
        },
        set jsonAddress(value){
            if(typeof value != 'undefined' && this._jsonAddress != value){
                //console.log('adsress %s', value ? JSON.stringify(value) : 'invalid');
                this._jsonAddress = value;
            }
        },
        _suggestedAdres: '', // адрес, выбранный из предложений яндекса
        get suggestedAdres(){
            return decodeURIComponent( this._suggestedAdres );
        },
        set suggestedAdres(value){
            if(typeof value != 'undefined' && value != this._suggestedAdres){
                this._suggestedAdres = encodeURIComponent( value.trim() );
                document.cookie = `suggestedAdres=${this._suggestedAdres}; max-age=31536000`;
            }
        },
        department: null
    }
    
    /*
    связывает поле ввода (input) со свойством
    - при изменении записывается в куки
    - при создании считывает из куки
    */
    bindInput(propName, tag = 'input'){
        let element = $(`#${tilda_form_id} ${tag}[name='${propName}']`);

        if(element)
        try {
            let elementVal = element.val()

            if(typeof elementVal != 'undefined'){
                let value = elementVal.trim()
                // если поле пустое, то считать из куки
                this.props[propName] = value ? value : this.getCookie( propName );

                // при выходе с элемента запоминаю значение в куку
                $(`#${tilda_form_id} ${tag}[name='${propName}']`).blur((event)=>{ 
                    this.props[propName] = $(event.currentTarget).val();
                });
            }
        } catch (error) {
            DEV_MODE && console.log(error);            
        }
    }

    el(elementName, tag = 'input'){
        return $(`#${tilda_form_id} ${tag}[name='${elementName}']`);
    }

    //onChangeAddress = null;

    constructor(){
        this.bindInput('phone');
        this.bindInput('name');
        this.bindInput('street');
        this.bindInput('flat');
        this.bindInput('coment', 'textarea');
        this.props.suggestedAdres = this.getCookie('suggestedAdres');
        if(this.props.suggestedAdres)
            this.props.street = this.props.suggestedAdres;
    }

    getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : '';
    }
}

// класс, отслеживающий ЗНАЧЕНИЕ итога
class PriceObserver {
    //observer = null;
    deliveryCost = 0;

    setDeliveryCost(dc){
        this.deliveryCost = dc;
        this.updateTotal();
    }

    priceToNumber(price){
        let match = price.match(/([\s\d]+)/);
        if(match){
            let val = match[1].replaceAll(' ', '');
            if (val == '')  
                throw 'не нашел цифры';
            return parseInt(val, 10);
        }
        else
            throw 'не нашел выражение';
    }

    updateTotal(){
        try {
            let calcTotal = 0;

            $("div.t706__product").each((index, element)=>{
                //let quantity = this.priceToNumber( $(element).find('div.t706__product-plusminus span.t706__product-quantity').text() );
                let total = this.priceToNumber( $(element).find('div.t706__product-amount').text() );
                calcTotal += total;
            });

            let total = this.priceToNumber( $('span.t706__cartwin-prodamount').text() );

            if((calcTotal+this.deliveryCost) !== total){
                //console.log( 'set new value: %s', calcTotal+this.deliveryCost );
                $('span.t706__cartwin-prodamount').html(`${calcTotal+this.deliveryCost}&nbsp;₽`);
                $('span.t706__cartwin-totalamount').html(`${calcTotal+this.deliveryCost}&nbsp;₽`);
            }
        } catch (error) {
            //console.log(error);                
        }
    }

    constructor(){
        let observer = new MutationObserver((mutations) => {  
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // запоминаю текущее значение
                    this.updateTotal();
                }
            });
        });

        let total = $('span.t706__cartwin-prodamount')[0];

        if(total){
            observer.observe(total, {
                attributes: false, 
                childList: true,        //characterData не вызывается, только childList
                characterData: false,
                subtree: false
            });
        }
    }
}


// отслеживает появление элемента с заданным классом
class ElementWatcher {
    constructor(elementToWatch, classToWatch, callback) {
        this.elementToWatch = elementToWatch ? elementToWatch : document.body;
        this.classToWatch = classToWatch;
        this.callback = callback;
        this.observer = null
        this.init();
    }

    init() {
        this.observer = new MutationObserver(this.mutationCallback)
        this.observe()
    }

    observe() {
        this.observer.observe(this.elementToWatch, { 
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    mutationCallback = mutationsList => {
        for(let mutation of mutationsList) {
            // if (mutation.type === 'attributes') {
            //     if(mutation.target == this.elementToWatch)
            //         console.log('changed attribyte "%s" for target "%s"', mutation.attributeName, mutation.target);
            // }
            // else if (mutation.type === 'characterData') {
            //     console.log('changed element.data for target "%s"', mutation.target);
            // }
            // else 
            if (mutation.type === 'childList') {
                if(mutation.addedNodes && this.callback)
                    this.callback();
            }
            // else 
            //     console.log('unknown type "%s"', mutation.type);
        }
    }

}

class AttributeWatcher {
    constructor(targetNode, attributeToWatch, attributeChangedCallback) {
        this.targetNode = targetNode
        this.attributeToWatch = attributeToWatch
        this.attributeChangedCallback = attributeChangedCallback
        this.observer = new MutationObserver(this.mutationCallback);
        this.observer.observe(this.targetNode, { attributes: true });
    }

    disconnect() {
        this.observer.disconnect();
        console.log('AttributeWatcher disconnected');
    }

    mutationCallback = mutationsList => {
        for(let mutation of mutationsList) {
            if (mutation.type === 'attributes') {
                console.log('attr changed: %s', mutation.attributeName);
            }
        }
    }
}

// отслеживает появление у элемента заданного класса
class ClassWatcher {
    constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
        this.targetNode = targetNode
        this.classToWatch = classToWatch
        this.classAddedCallback = classAddedCallback
        this.classRemovedCallback = classRemovedCallback
        this.observer = null
        this.lastClassState = targetNode.classList.contains(this.classToWatch)

        this.init()
    }

    init() {
        this.observer = new MutationObserver(this.mutationCallback)
        this.observe()
    }

    observe() {
        this.observer.observe(this.targetNode, { attributes: true });
    }

    disconnect() {
        this.observer.disconnect()
    }

    mutationCallback = mutationsList => {
        for(let mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                let currentClassState = mutation.target.classList.contains(this.classToWatch)
                if(this.lastClassState !== currentClassState) {
                    this.lastClassState = currentClassState
                    if(currentClassState) {
                        this.classAddedCallback()
                    }
                    else {
                        //this.classRemovedCallback()
                    }
                }
            }
        }
    }
}

$(document).ready(function ()
{
    const moscowBound = [[55.142627, 36.803259],[56.021281, 37.967682]];

    var elementWatchers = [];

    var DEV_MODE = true;
    window.BRAND_CODE = '100000014';
    if(window.location.hostname == 'kalyandostavka.ru'){
        window.CHAIHONA_HOST = 'https://chaihona1.ru';
        DEV_MODE = false;
    }
    else if(window.location.hostname == 'kalyan.kei.ru')
        window.CHAIHONA_HOST = 'https://kei.chaihona1.ru';
    else 
        window.CHAIHONA_HOST = 'https://tilda.dev.chaihona1.ru';

    console.log('v1.%s, CHAIHONA_HOST = %s', window.script_version, window.CHAIHONA_HOST);

    DEV_MODE && console.log('PATH=%s', window.location.pathname);

    var ud = null;
    var priceObserver = null;
    // может поменяться при проверке адреса
    var delivery_min_sum = 1500;
    var delivery_cost = 0;
    var delivery_work_time = '11:00-05:00';
    var delivery_minutes = 100;
    var errorSet = new Set();

    var deliveryDays = []
    var selectedDeliveryDay = null
    var deliveryByWeekObj = null
    var selectedDeliveryTime = null
    var dataDeliveryTime = null

    // бесконечная прокрутка даты
    // var lastScrollTop = 0;
    // var selectObj = null;
    // var singleoptionheight = null;
    // var selectboxheight = null;
    // var numOfOptionBeforeToLoadNextSet = 2;
    // var nextScrollDate = new Date();
    // var dateSelected = ' selected';
    // var isAppending = false;
    // var currentScroll = 0;

    if(window.location.pathname == '/' || window.location.pathname == '/shop') processRoot();
    else if(window.location.pathname == '/success' || window.location.pathname == '/success/') processSuccess();
    else if(window.location.pathname == '/paymenterror' || window.location.pathname == '/paymenterror/') processPaymentError();

    function processRoot(){
        // selectObj = $("select[name='date']");
        // singleoptionheight = selectObj.find("option").height();
        // selectboxheight = selectObj.height();
        ud = new UserData();

        let cssId = 'jQueryUI_CSS';
        if (!document.getElementById(cssId))
        {
            let link  = document.createElement('link');
            link.id   = cssId;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css';
            link.media = 'all';
            document.head.appendChild(link);
        }
    
        if(typeof jQuery.ui == 'undefined'){
            let script = document.createElement('script');
            script.async = false;
            script.src = 'https://code.jquery.com/ui/1.12.1/jquery-ui.js';
            document.head.appendChild(script);
        }
    
        if(typeof ymaps == 'undefined' || typeof ymaps.suggest == 'undefined'){
            //DEV_MODE && console.log('ymaps or ymaps.suggest undefined, load script');
            let script = document.createElement('script');
            script.async = false;
            script.onload = onYmapsReady;
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=9cf52b96-70cc-4eab-81a3-53ffdd4850e2';
            document.head.appendChild(script);
        } 
        else onYmapsReady();

        priceObserver = new PriceObserver();

        //TODO вывести информацию о невозможности оплаты онлайн - проверить

        // при входе на страницу скрываю блок с кнопкой "оплатить"
        // тильда походу не использует аттрибут action у кнопки submit, 
        // поэтому невозможно переопределить ее поведение
        $(`#${tilda_form_id} div.t-form__submit`).hide();

        // перекрашиваю нижний блок ошибок
        $('.t-form__errorbox-text').css("color", "#EB334B");
        $('.t-form__errorbox-wrapper').css("background", "#FFEFC0");
        $('.t-form__errorbox-item').css("font-size", "14px");

        // принудительно переключаюсь на наличные
        $('input:radio[name="paymentsystem"]').filter('[value="cash"]').attr('checked', true);
        $('input:radio[name="paymentsystem"]').attr('disabled',true);

        // очищаю время доставки
        $("select[name='time']").empty();

        // и дату
        $("select[name='date']").empty();

        // если выбрали следующий день, то "Сегодня" меняю на "Завтра"
        // $("select[name='time']").change(function(){
        //     let selTime = $("select[name='time']").val();
        //     let curTime = (new Date()).getHours();

        //     if(parseInt(selTime.substring(0, 2)) < curTime){
        //         if(selectObj.find(":selected").index()==0){
        //             selectObj.find(':nth-child(2)').prop('selected', true); 
        //         }
        //     }
        // });

        // if(selectObj){
        //     selectObj.empty();

        //     // лайфхак для скрытия списка после выбора
        //     //selectObj.mousedown( function(){ if(this.options.length>8) this.size=8; });
        //     //selectObj.blur( function(){ this.size=0; });
        //     selectObj.change( function(){ 
        //         //this.size=0; 

        //         if(selectObj.find(":selected").index()==0){
        //             let selTime = $("select[name='time']").val();
        //             let curTime = (new Date()).getHours();

        //             // выбрали "сегодня" - переформировываю время
        //             setDeliveryTime(delivery_work_time, delivery_minutes);
                    
        //             if(parseInt(selTime.substring(0, 2)) < curTime){
        //                 $("select[name='time'] :nth-child(1)").prop('selected', true); 
        //             } else {
        //                 $(`select[name='time'] option[value='${selTime}']`).prop("selected", true);
        //             }
        //         } else {
        //             let selTime = $("select[name='time']").val();

        //             // "завтра" уже доступны любые рабочие часы
        //             setDeliveryTime(delivery_work_time, delivery_minutes);

        //             $(`select[name='time'] option[value='${selTime}']`).prop("selected", true);
        //         }
        //     });
                
        //     LoadNextSetOfOptions(0);            

        //     selectObj.scroll(function(event) {
        //         OnDateScroll(event);
        //     });
        // }

        //01.10.2020 в поле телефон плейсхолдер +7(999)999-99-99, при фокусе автоматически вставлять +7
        ud.el('phone').attr('placeholder', '+7(999)999-99-99');
        ud.el('phone').focus(function(){
            if(this.value=='') this.value = '+7';
        });

        // тильда глючит - не пускает в редактирование CSS...
        // задаю стили для autocomplete
        let styleTag = $('<style>ul.ui-autocomplete { z-index: 999999; } div.ui-menu-item-wrapper {line-height: 2em;}</style>');
        $('html > head').append(styleTag);

        // setDeliveryTime('11:00-05:00', 100);

        setDeliveryTimeByWeek({
            "mon": "11:00-05:00",
            "tue": "11:00-05:00",
            "wed": "11:00-05:00",
            "thu": "11:00-05:00",
            "fri": "11:00-05:00",
            "sat": "11:00-05:00",
            "sun": "11:00-05:00"
        }, 60);

        // рисуем аналогичную кнопку для перехода на оплату в чайхону   
        $(`#${tilda_form_id} div.t-form__inputsbox`).append(`
            <div 
                id="chaihona_pay" 
                style="text-align:center;vertical-align:middle;height:100%;margin-top:30px;margin-bottom:10px;width:100%;">
                
                <button 
                    onclick="window.chaihona_pay_click();return false;"
                    style="font-family:'Manrope',Arial,sans-serif;text-align:center;height:60px;border:0 none;font-size:16px;padding-left:60px;padding-right:60px;font-weight:700;white-space:nowrap;background-image:none;cursor:pointer;margin:0;box-sizing:border-box;outline:none;background:transparent;position:relative;width:100%;color:#ffffff;background-color:#ff0044;border-radius:8px; -moz-border-radius:8px; -webkit-border-radius:8px;">
                    
                    Оплатить
                    
                </button>
                
            </div>`);

        ud.el('street').change(function(){ 
            // при ручной корректировке инвалидирую адрес
            ud.props.jsonAddress = null; 
        });

        // при редактировании квартиры убираю и показываю ошибку
        ud.el('flat').on('input',function(e){
            if(ud.el('flat').val().trim().length == 0)
                showError(ud.el('flat'), 'Введите номер квартиры', 'js-rule-error-all');
            else
                hideError( ud.el('flat') );
        });

        // подписываюсь на события ухода с поля ввода адреса
        ud.el('street').blur(function(){ checkAdress(); });
        
        // при смене типа оплаты меняю текст кнопки
        $('input:radio[name="paymentsystem"]').change(function() {
            if( $(this).val()=='cash' ) $('#chaihona_pay button').text('Оформить');
            else $('#chaihona_pay button').text('Оплатить');
        });

        $("select[name='time']").change(function(){
            onTimeChange()
        })

        $("select[name='date']").change(function(){
            onDateChange()
        })

        // скрываю блок со SKU, мне он нужен для идентификации блюд, но дизайнеру не нравится
        new ClassWatcher(
            document.getElementsByClassName('t706__cartwin')[0], 
            't706__cartwin_showed', 
            function(){
                // очищаю старые наблюдатели
                elementWatchers = [];

                hideSKU();

                // при удалении/изменении блюда пересоздается t706__cartwin-products
                // наблюдатели за конкретными элементами не работают - смотрю на весь список
                let cartWinProducts = $('div.t706__cartwin-products');
                if(cartWinProducts)
                    elementWatchers.push(
                        new ElementWatcher(cartWinProducts[0], null, function(){
                            //console.log('что-то изменилось в t706__cartwin-products, скрываю SKU');
                            hideSKU();
                        })
                    );
            }, null);

        // кликнули на оплатить, проверка полей и редирект в чайхону
        window.chaihona_pay_click = function()
        {
            if($('#chaihona_pay').attr('processing')) {
                alert('Заказ уже в обработке, ждите...');
                return;
            }

            hideAllErrors();
            hideBottomError('js-rule-error-all');
            //TODO неверный адрес, сбрасывать при нахождении
            hideBottomError('js-rule-error-minlength');

            let firstErrorElement = null;

            if(ud.props.jsonAddress && !ud.props.jsonAddress.house){
                showError(ud.el('street'), 'Введите номер дома', 'js-rule-error-all');
                firstErrorElement = firstErrorElement || ud.el('street');
            }

            if(!ud.props.jsonAddress){
                showError(ud.el('street'), 'Введите адрес доставки с номером дома', 'js-rule-error-all');
                firstErrorElement = firstErrorElement || ud.el('street');
            }

            // нигде больше квартира не присваивается...
            ud.props.flat = ud.el('flat').val()

            if(!ud.props.flat){
                showError(ud.el('flat'), 'Введите номер квартиры', 'js-rule-error-all');
                firstErrorElement = firstErrorElement || ud.el('flat');
            }

            let name = ud.el('name');
            if(/^[\S\s]+$/.test(name.val())){
                name.parent().find('div.t-input-error').hide();
                hideBottomError('js-rule-error-name');
            } else {
                showError(name, 'Введите Ваше имя', 'js-rule-error-name');
                firstErrorElement = firstErrorElement || name;
            }

            let phone = ud.el('phone');
            let purePhone = '';
            if(/^\+*[\d\(\)\-\s]+$/.test(phone.val())){
                purePhone = phone.val().replace(/[\(\)\+\s\-]/g, '');
                if(purePhone.length==11){
                    phone.parent().find('div.t-input-error').hide();
                    hideBottomError('js-rule-error-phone');
                } else {
                    showError(phone, 'Неверная длина номера телефона, должно быть 11 цифр с кодом страны', 'js-rule-error-phone');
                    firstErrorElement = firstErrorElement || phone;
                }
            } else {
                showError(phone, 'Неверный формат номера телефона', 'js-rule-error-phone');
                firstErrorElement = firstErrorElement || phone;
            }

            // из суммы вырезаем пробелы и сравниваем с delivery_min_sum
            let totalObj = $('span.t706__cartwin-prodamount');
            let totalMatches = totalObj.text().match(/([\s\d]+)/);
            let total = totalMatches[1].replace(/\s/g, '');
            if(parseInt(total)<delivery_min_sum)
                showBottomError(`Минимальный заказ ${delivery_min_sum}&nbsp;₽`, 'js-rule-error-minorder');
            else
                hideBottomError('js-rule-error-minorder');

            let payment = $(`#${tilda_form_id} input[name='paymentsystem']:checked`).val();
                
            if (errorSet.size) {
                let ignoreError = false
                
                // если у ресторана нет онлайн-оплаты и выбрана оплата наличными, то игнорирую ошибку
                errorSet.forEach(element => {
                   if(element == 'js-rule-error-string-online' && payment=='cash') 
                    ignoreError = true
                });

                if(!ignoreError){
                    if(firstErrorElement){
                        $('div.t706__cartwin').animate({scrollTop: -100 });
                    }
                    return;
                }
            }
            
            let total_price = $('div.t706__cartwin-prodamount-wrap span.t706__cartwin-prodamount').text();
            // let delivery_date = $(`#${tilda_form_id} select[name='date']`).val();
            let delivery_time = $(`#${tilda_form_id} select[name='time']`).val();

            // now к дате цеплять нельзя
            //let target_time_date = (delivery_time == 'now') ? delivery_time : delivery_date + ' ' + delivery_time;

            let params=`<input type="hidden" name="phone" value="${purePhone}"/>
                <input type="hidden" name="name" value="${ud.props.name}"/>
                <input type="hidden" name="city" value="${ud.props.jsonAddress.city}"/>
                <input type="hidden" name="street" value="${ud.props.jsonAddress.street}"/>
                <input type="hidden" name="house" value="${ud.props.jsonAddress.house}"/>
                <input type="hidden" name="flat" value="${ud.props.flat}"/>
                <input type="hidden" name="department" value="${ud.props.department}"/>
                <input type="hidden" name="total" value="${total_price}"/>
                <input type="hidden" name="delivery_cost" value="${delivery_cost}"/>
                <input type="hidden" name="payment" value="${payment}"/>
                <input type="hidden" name="coment" value="${ud.props.coment}"/>
                <input type="hidden" name="delivery_time" value="${delivery_time}"/>
                <input type="hidden" name="lat" value="${ud.props.jsonAddress.lat}"/>
                <input type="hidden" name="lon" value="${ud.props.jsonAddress.lon}"/>
                <input type="hidden" name="fullAddress" value="${ud.props.jsonAddress.fullAddress}"/>
                <input type="hidden" name="brand" value="${window.BRAND_CODE}"/>`;

            let hasKalyan = false;

            $("div.t706__product").each(function(){
                let dish_name = $(this).find('div.t706__product-title a').text();
                dish_name = dish_name.replace(/\"/g, "'").trim();
                
                if (dish_name.match(/кальян/i))
                    hasKalyan = true;

                // let sku = $(this).find('div.t706__product-title div:last').text();
                // let modif = $('div.t706__product-title div:not([style*="opacity"])', this).text();

                // в эту же кучу добавился модификатор, SKU пока последним элементом
                let sku = $(this).find('div.t706__product-title__option:last-child').text();

                // ищу модификатор, он перед SKU
                let modif = $('div.t706__product-title__option > div', this).text();


                let quantity = $(this).find('div.t706__product-plusminus span.t706__product-quantity').text();
                let total = $(this).find('div.t706__product-amount').text();
                params += `<input type="hidden" name="dish[]" value="${sku}|${dish_name}|${quantity}|${total}|${modif}"/>`;
            });

            if(!hasKalyan){
                showBottomError('В заказе должен быть кальян', 'js-rule-error-all');
                return;
            }

            if(DEV_MODE && ud.props.flat != 71953) {
                alert('Извините, сайт на реконструкции, попробуйте позже')
                return
            }

            // запрет повторного клика
            $('#chaihona_pay').attr('processing','1');

            $(`<form action="${window.CHAIHONA_HOST}/eda-na-raione" method="POST">${params}</form>`).appendTo($(document.body)).submit();
        }
    }

    function hideSKU(){
        // блюд может быть несколько
        $('div.t706__product').each(function(){
            // SKU ПОКА последний div в куче
            $('div.t706__product-title div:last', this).hide();
        });
    }

    function processPaymentError(){
        let message = /message=([^&]+)/.exec(window.location.href)[1];
        if(message)
            $('div.t017__uptitle').text( decodeURI(message) );
    }

    function processSuccess(){
        // вручную чистим корзину:
        // - открываю корзину, блюда в нее добавляются только при открытии
        // - всем блюдам жму "удалить"
    
        let orderNum = null
        try {
            orderNum = /order=([^&]+)/.exec(window.location.href)[1];
            let orderElement = $('div.t-text:contains(Заказ)');
            if (orderElement && orderNum){
                orderElement.text(`Заказ № ${decodeURI(orderNum)} оформлен`);
            }
        } catch (error) {
            
        }
    
        // если есть иконка корзины
        let cart_showed = $('div.t706__carticon.t706__carticon_showed');
    
        if(cart_showed.length)
            purgeBasket();
        else {
            DEV_MODE && console.log('Иконка корзины не найдена');
            new ElementWatcher(null, null, function(){
                let cart_showed = $('div.t706__carticon.t706__carticon_showed');
                if(cart_showed.length)
                    purgeBasket();
            });
        }
    }

    function purgeBasket(){
        DEV_MODE && console.log('Корзина найдена - запускаю очистку');
        new ClassWatcher(
            document.getElementsByClassName('t706__cartwin')[0], 
            't706__cartwin_showed', 
            function(){
                $('div.t706__product-del').each(function(){
                    $(this).click();
                })
                setTimeout(function(){
                    $('div.t706__cartwin-close').click()
                })
            }, null);

        // открываю корзину, чтобы прокликать на удаление все товары    
        $('div.t706__carticon').click();
    }

    function onYmapsReady(){
        //DEV_MODE && console.log('ymaps loaded');
        ymaps.ready(async function () {
            //DEV_MODE && console.log('ymaps ready');

            $("input[name='street']").autocomplete({
                // вызывается при вводе более 3-х символов, список формирую из ответов яндекса
                source: async(request, response) => {
                    let items = await ymaps.suggest(request.term, { boundedBy: moscowBound, results: 7 });
        
                    let arrayResult = [];
                    let arrayPromises = [];
        
                    items.forEach((element) => {
                        if (!element.value.match(/.*подъезд.*/)) 
                        {
                            // можно и по одному await-ить, но параллельно быстрее
                            arrayPromises.push( ymaps.geocode(element.value, { boundedBy: moscowBound }).then(gc=>{
                                let res = prepeareGC(gc, element.value);

                                if(res)
                                    arrayResult.push( res );
                            }));
                        }
                    });
        
                    // ждем, пока все запросы не обработаются
                    await Promise.all(arrayPromises).then(function(){
                        return ymaps.vow.resolve(arrayResult);
                    });
        
                    //response( availableTags);
                    response( arrayResult );
                },
                // при выборе варианта делю улицу и дом
                select: function(event, ui){
                    DEV_MODE && console.log('ui.item.jsonData = %s', JSON.stringify(ui.item.jsonData));

                    ud.props.street = ui.item.value;
                    if(ud.props.suggestedAdres != ui.item.value){
                        ud.props.suggestedAdres = ui.item.value;
                        ud.props.department = null;
                    }
                    if(ui.item.jsonData.house){
                        ud.props.jsonAddress = ui.item.jsonData;
                        checkAdress();
                    }
                },
                minLength: 3
            });

            // при запуске suggestedAdres может быть уже заполнен из localstorage, переводим его в jsonAddress
            if(ud.props.suggestedAdres){
                // разбираю запомненный адрес
                let gc = await ymaps.geocode( ud.props.suggestedAdres, { boundedBy: moscowBound } );
                let res = prepeareGC(gc, ud.props.suggestedAdres);
                if(res){
                    // есть валидный адрес
                    // DEV_MODE && console.log('prepared suggestedAdres: %s', JSON.stringify(res));
                    if(res.jsonData.house){
                        ud.props.jsonAddress = res.jsonData;
                        checkAdress();
                    }
                }
            }
        });
    }

    function getCustomHouse(value){
        var result = value.match(/[0-9]{1,3}[0-9а-я\/]{1,4}/i);
        if(result)
            return result[0];
        return "";
    }

    function prepeareGC(gc, elementValue){
        let displayName = "";
        let value = elementValue;

        let geoObject = gc.geoObjects.get(0);

        if (geoObject && geoObject.getCountryCode() == "RU") {
            let city = geoObject.getLocalities()[0] || geoObject.getAdministrativeAreas()[0];
            let street = geoObject.getThoroughfare() || geoObject.getLocalities()[0];
            if(city == street && city != 'Зеленоград')
                street = geoObject.getLocalities()[2];
            
            let jsonData = {
                'city': city,
                'street': street ? street : '',
                'house': geoObject.getPremiseNumber() || getCustomHouse(value),
                'fullAddress':  geoObject.getAddressLine()
            }

            let coordinates = geoObject.geometry.getCoordinates();
            if (Array.isArray(coordinates) && coordinates.length > 1) {
              jsonData.lat = coordinates[0]
              jsonData.lon = coordinates[1]
            }

            value = value.replace(geoObject.getCountry()+", ", "");
            value = value.replace(geoObject.getAdministrativeAreas()[0]+", ", "");
            value = value.replace("undefined", "");
            // displayName = "<div class='yandex-map-address_info'>"+value+"</div><div class='yandex-map-localities_info'>"+geoObject.getCountry()+", "+geoObject.getLocalities()[0]+"</div>";
            // displayName = displayName.replace("undefined", "");

            // pushGeoData(displayName, value, jsonData);
            // function pushGeoData(displayName, value, jsonData) {
            return {displayName, value, jsonData};
            // }
        }
        return null;
    }

    function pad(n){ return ('00' + n).slice(-2); }

    // функция проверки адреса
    async function checkAdress(force = false)
    {
        let address = ud.el('street').val();
        if(!force && ud.props.suggestedAdres == address && ud.props.jsonAddress && ud.props.department){
            DEV_MODE && console.log('адрес остался прежним, проверку не запускаю (1)');
            return;
        }

        // адрес изменили, но строка есть, возможно корректировали дом
        if(!ud.props.jsonAddress){

            if(address && typeof ymaps.geocode != 'undefined'){
                DEV_MODE && console.log('в адресе что-то изменилось, перепроверяю');
                let gc = await ymaps.geocode( address, { boundedBy: moscowBound } );
                let res = prepeareGC(gc, address);
                if(res){
                    if(ud.props.suggestedAdres == address){
                        // адрес не изменился, запоминаю и выхожу
                        ud.props.suggestedAdres = address;
                        if(res.jsonData.house){
                            ud.props.jsonAddress = res.jsonData;
                            DEV_MODE && console.log('адрес остался прежним, проверку не запускаю (2)');
                            return;
                        }
                    }

                    ud.props.suggestedAdres = address;
                    if(res.jsonData.house)
                        ud.props.jsonAddress = res.jsonData;
                }
            }
        }

        // если поля заполнены 
        if (ud.props.jsonAddress) {

            let doc_date = $("select[name='time']").val()

            let data = {
                city: ud.props.jsonAddress.city,
                street: ud.props.jsonAddress.street, 
                house: ud.props.jsonAddress.house,
                brand: window.BRAND_CODE,
                fullAddress: ud.props.jsonAddress.fullAddress,
                lat: ud.props.jsonAddress.lat,
                lon: ud.props.jsonAddress.lon,
                doc_date
            };

            // перед новым запросом гашу старую ошибку
            ud.el('street').parent().find('div.t-input-error').hide();
                
            // запрашиваем возможность доставки у АПИ
            $.ajax({
                url: `${window.CHAIHONA_HOST}/eda-na-raione`,
                type: 'GET',
                crossDomain: true,
                data
            }).done(function(rawData){
                DEV_MODE && console.log(rawData);
                let data = JSON.parse( rawData );
                let chaihona_pay = $('#chaihona_pay');
                if(data.error){
                    chaihona_pay.attr('allow_pay', 'false');
                    // реальную ошибку пишу в консоль, на экран всегда одну...
                    console.log(data.error);
                    showError(ud.el('street'), 'К сожалению, мы не доставляем по указанному адресу', 'js-rule-error-minlength');
                }
                else if(data.message){
                    hideBottomError('js-rule-error-string-online');
                    hideBottomError('js-rule-error-string-worktime');

                    //TODO где-то вписать сумму доставки
                    // формирую выпадающий список "доставить к"
                    work_time = data.work_time ? data.work_time : '11:00-05:00'

                    if(typeof data.delivery_cost != 'undefined') {
                        delivery_min_sum = data.delivery_min_sum
                        delivery_cost = data.delivery_cost

                        priceObserver.setDeliveryCost(delivery_cost)
                        
                        $('span:contains(Сумма:)').each(function(){
                            let text = "Сумма:&nbsp;";
                            if(delivery_cost>0)
                                text = `Стоимость доставки:&nbsp;${delivery_cost}&nbsp;₽<br/>` + text
                            $(this).html(text)
                        })
                    }

                    if(data.week_days){ 
                        setDeliveryTimeByWeek(data.week_days, parseInt(data.delivery_time));

                        // показываю СВОЮ кнопку "оплатить"
                        chaihona_pay.attr('allow_pay', 'true');
                        if(!data.online_payment){
                            $(`#${tilda_form_id} input[name='paymentsystem'][value='cash']`).prop('checked', true);
                            $(`#${tilda_form_id} input[name='paymentsystem'][value='cloudpayments']`).attr("disabled",true);
                        
                            showBottomError('Обслуживающий ресторан не поддерживает онлайн-оплату', 'js-rule-error-string-online');

                            $('#chaihona_pay button').text('Оформить');
                        }
                        ud.props.department = data.department;
                    }
                    else{
                        showBottomError('В ответе сервера нет времени работы ресторана', 'js-rule-error-string-worktime');
                    }

                    // if(data.work_time){ 
                    //     setDeliveryTime(data.work_time, parseInt(data.delivery_time));

                    //     delivery_work_time = data.work_time;
                    //     delivery_minutes = parseInt(data.delivery_time);
                    //     delivery_min_sum = data.delivery_min_sum;
                    //     delivery_cost = data.delivery_cost;
                    //     priceObserver.setDeliveryCost(delivery_cost);
                        
                    //     $('span:contains(Сумма:)').each(function(){
                    //         let text = "Сумма:&nbsp;";
                    //         if(delivery_cost>0)
                    //             text = `Стоимость доставки:&nbsp;${delivery_cost}&nbsp;₽<br/>` + text;
                    //         $(this).html(text);
                    //     });

                    //     // показываю СВОЮ кнопку "оплатить"
                    //     //chaihona_pay.show();
                    //     chaihona_pay.attr('allow_pay', 'true');
                    //     if(!data.online_payment){
                    //         $(`#${tilda_form_id} input[name='paymentsystem'][value='cash']`).prop('checked', true);
                    //         $(`#${tilda_form_id} input[name='paymentsystem'][value='cloudpayments']`).attr("disabled",true);
                        
                    //         showBottomError('Обслуживающий ресторан не поддерживает онлайн-оплату', 'js-rule-error-string');
                    //         //$('div.js-errorbox-all').show();
                        
                    //     }
                    //     ud.props.department = data.department;
                    // }
                    // else{
                    //     showBottomError('В ответе сервера нет времени работы ресторана', 'js-rule-error-string');
                    // }
                }
            });
        }
    }

    function hideError(element){
        if(element){
            let errorElement = element.parent().find('div.t-input-error');
            if(errorElement)
                errorElement.hide();
        }
    }

    // показ ошибок в штатных местах - под полем и рядом с кнопкой оплатить
    function showError(element, errorText, bottomClass=null){
        console.log('showError: %s', errorText);
        if(element){
            let errorElement = element.parent().find('div.t-input-error');
            if(errorElement){
                // показываю текст ошибки
                errorElement.html( errorText );
                errorElement.show();
            }
        }
        
        if(bottomClass){
            errorSet.add(bottomClass);
            // $('p.t-form__errorbox-item.'+bottomClass).show();
            // $('p.t-form__errorbox-item.'+bottomClass).html(errorText);
        }
        
        // if(errorSet.size)
        //     $('div.js-errorbox-all').show();
    }

    function showBottomError(errorText, bottomClass){
        console.log('showBottomError: %s', errorText);
        errorSet.add(bottomClass)

        if(bottomClass.search(/js-rule-error-string-.*/)!=-1)
            bottomClass = 'js-rule-error-string'

        $('p.t-form__errorbox-item.'+bottomClass).show()
        $('p.t-form__errorbox-item.'+bottomClass).html(errorText)
        $('div.js-errorbox-all').show()
    }

    function hideBottomError(bottomClass){
        errorSet.delete(bottomClass)

        if(bottomClass.search(/js-rule-error-string-.*/)!=-1)
            bottomClass = 'js-rule-error-string'

        $('p.t-form__errorbox-item.'+bottomClass).hide()
        $('div.js-errorbox-all').hide()
    }
    
    // скрывает все ошибки при клике на "оплатить"
    function hideAllErrors(){
        $('p.t-form__errorbox-item').each(function(){
            $(this).hide();
        });
    }

    /**
     * Формирую массив дней (+30)
     * 
     * @param {int} [count]
     */
    function getDeliveryDays(count = 30){
        let res = []
        let nextDate = new Date()
        let select = $("select[name='date']")

        if(select){
            select.empty()

            for (let i = 1; i < count; i++) {
            let y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(nextDate);
            let m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(nextDate);
            let d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(nextDate);
    
            let number = new Intl.DateTimeFormat('ru', { day: 'numeric' }).format(nextDate);
            let month = new Intl.DateTimeFormat('ru', { month: 'long' }).format(nextDate);
            let weekDay = new Intl.DateTimeFormat('ru', { weekday: 'long' }).format(nextDate);
            
            // отображаемое значение селекта
            let showDate = res.length==0 ? 'Сегодня' : `${number} ${month}, ${weekDay}`;
    
            // значения формирую в ISO, чтобы потом парсером разобрало верно
            let id = `${y}-${m}-${d}T12:00:00.000Z`
    
            res.push( {
                name: showDate, 
                id: id //`${nextDate.toISOString()}`
            } );
    
            select.append(new Option(showDate, id, false, id==selectedDeliveryDay))

            // прибавляется день
            nextDate.setDate( nextDate.getDate()+1 )
            }
        }

        return res
    }

    function getWorkTime(){
        // возвращает рабочее время для выбранной даты дд.мм.гггг
        if(deliveryByWeekObj && selectedDeliveryDay){
          // есть информация по дням недели
          // console.log( 'formDeliveryDay = '+this.formDeliveryDay )
  
          let date = new Date(selectedDeliveryDay)
  
          switch (date.getDay()) {
            case 0:
              return deliveryByWeekObj.sun
            case 1:
              return deliveryByWeekObj.mon
            case 2:
              return deliveryByWeekObj.tue
            case 3:
              return deliveryByWeekObj.wed
            case 4:
              return deliveryByWeekObj.thu
            case 5:
              return deliveryByWeekObj.fri
            case 6:
              return deliveryByWeekObj.sat
            default:
              return '11:00-05:00'
          }
        }
        else
          return work_time ? work_time : '11:00-05:00'
    }

    function setDeliveryTimeByWeek(week_days, delivery_time){
        if(week_days) deliveryByWeekObj = week_days
        if(delivery_time) dataDeliveryTime = parseInt(delivery_time)
        let select = $("select[name='time']")
        if(select){
            select.empty()
    
            deliveryDays = getDeliveryDays()

            if(!selectedDeliveryDay)
                selectedDeliveryDay = deliveryDays[0].id

            let today = deliveryDays.findIndex((element)=>{
                return element.id == selectedDeliveryDay
            })==0;
        

            let now = new Date()
            let target = new Date(selectedDeliveryDay)
            let tomorrow = new Date(selectedDeliveryDay)
            tomorrow.setDate( tomorrow.getDate()+1 )
      
            work_time = getWorkTime()
            
            // console.log('work_time = %s', work_time)
      
            let match = work_time.match(/(\d+):(\d+)-(\d+):(\d+)/)
            
            let time_shift = parseInt(delivery_time)
      
            if(match){
              let start_time = parseInt(match[1])*60 + parseInt(match[2]) + time_shift
              let end_time = parseInt(match[3])*60 + parseInt(match[4]) + time_shift
      
              // 11:00-03:00
              if (end_time < start_time) end_time += 24*60
      
              let begin_time = 0
      
              if(today) {
                // к текущему времени сразу прибавляю время доставки
                begin_time = now.getHours()*60 + now.getMinutes() + time_shift
                // если доставка уже работает
                if (begin_time>=start_time)
                    select.append(new Option('Как можно быстрее', 'now', true))
              }
      
              for (let i = start_time; i < end_time; i+=30){
                if(i>=begin_time){
                    if(i>=24*60)
                    {
                        let value = `${pad(tomorrow.getDate())}.${pad(tomorrow.getMonth()+1)}.${tomorrow.getFullYear()} ${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`
                        if(!selectedDeliveryTime) selectedDeliveryTime = value
                        select.append(new Option(
                            `${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )} (${pad(tomorrow.getDate())}.${pad(tomorrow.getMonth()+1)})`, 
                            value, false, 
                            value.substr(-5) == selectedDeliveryTime.substr(-5)))
                    }
                    else {
                        let value = `${pad(target.getDate())}.${pad(target.getMonth()+1)}.${target.getFullYear()} ${pad( Math.floor(i/60) )}:${pad( i%60 )}`
                        if(!selectedDeliveryTime) selectedDeliveryTime = value
                        select.append(new Option(
                            `${pad( Math.floor(i/60) )}:${pad( i%60 )}`, 
                            value, false, 
                            value.substr(-5) == selectedDeliveryTime.substr(-5)))
                    }
                }
              }
            }
        }
    }

    /**
     * В выпадающем списке сменили время доставки - проверить ресторан (может быть ночная зона)
     */
    function onTimeChange(){
        selectedDeliveryTime = $("select[name='time']").val()
        //console.log('selectedDeliveryTime = %s', selectedDeliveryTime)
        checkAdress(true)
    }

    /**
     * В выпадающем списке сменили дату доставки - проверить ресторан (может быть ночная зона)
     */
    function onDateChange(){
        selectedDeliveryDay = $("select[name='date']").val()
        checkAdress(true)
    }

    // заполнение списка времени доставки с учетом времени работы ресторана И ДАТЫ
    /*
    function setDeliveryTime(work_time, delivery_time){
        let select = $("select[name='time']");
        if(select){
            select.empty();

            let today = (selectObj.find(":selected").index()==0);

            let date = new Date();
            let tomorrow = (new Date()).setDate( date.getDate()+1 );

            let y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(date);
            let m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(date);
            let d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(date);

            // let date_str = `${d}.${m}.${y}`;

            y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(tomorrow);
            m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(tomorrow);
            d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(tomorrow);

            // let tomorrow_str = `${d}.${m}.${y}`;

            let match = work_time.match(/(\d+):(\d+)-(\d+):(\d+)/);
            
            if(match){
                let start_time = parseInt(match[1])*60 + parseInt(match[2]);
                let end_time = parseInt(match[3])*60 + parseInt(match[4]) + delivery_time;
                
                // переход через полночь
                if(end_time<start_time) end_time += 24*60;

                // к текущему времени сразу прибавляю время доставки
                let begin_time = date.getHours()*60 + date.getMinutes() + delivery_time;

                if(today && begin_time>start_time)
                    select.append(new Option('Как можно быстрее', 'now'));

                for (let i = start_time; i < end_time; i+=30){
                    if(!today || i>=begin_time){
                        if(i<24*60)
                            select.append(new Option(
                                `${pad( Math.floor(i/60) )}:${pad( i%60 )}`, 
                                `${pad( Math.floor(i/60) )}:${pad( i%60 )}`));
                                // `${date_str} ${pad( Math.floor(i/60) )}:${pad( i%60 )}`));
                        else
                            select.append(new Option(
                                `${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`, 
                                `${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`));
                                // `${tomorrow_str} ${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`));
                    }
                }
            }
        }
    }
    */



    // function OnDateScroll(event) {
    //     var st = $(selectObj).scrollTop();
    //     var totalheight = selectObj.find("option").length * singleoptionheight;
    //     if (st > lastScrollTop) {
    //         currentScroll = st + selectboxheight;
    //         if ((currentScroll + (numOfOptionBeforeToLoadNextSet * singleoptionheight)) >= totalheight) {
    //             LoadNextSetOfOptions();
    //         }
    //     }
    //     lastScrollTop = st;
    // }

    // function LoadNextSetOfOptions(count = 10) {
    //     let limit = (count==0) ? 100 : 10;

    //     for (i = 1; i < limit; i++) {
    //         let y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(nextScrollDate);
    //         let m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(nextScrollDate);
    //         let d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(nextScrollDate);

    //         let number = new Intl.DateTimeFormat('ru', { day: 'numeric' }).format(nextScrollDate);
    //         let month = new Intl.DateTimeFormat('ru', { month: 'long' }).format(nextScrollDate);
    //         let weekDay = new Intl.DateTimeFormat('ru', { weekday: 'long' }).format(nextScrollDate);
            
    //         let showDate = (count==0) ? 'Сегодня' : ((count==1)?'Завтра':`${number} ${month}, ${weekDay}`);

    //         $(selectObj).append(new Option(showDate, `${d}.${m}.${y}`));

    //         nextScrollDate.setDate( nextScrollDate.getDate()+1 );

    //         dateSelected = '';
    //         count++;
    //     }
      
    //     $(selectObj).scrollTop(currentScroll - (selectboxheight));
    // }


});

