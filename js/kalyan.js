$(document).ready(function (){
    var DEV_MODE = false;
    if(window.location.hostname == 'kalyandostavka.ru')
        window.CHAIHONA_HOST = 'https://chaihona1.ru';
    else {
        window.CHAIHONA_HOST = 'https://wwwmk.dev.chaihona1.ru';
        DEV_MODE = true;
    }

    window.BRAND_CODE = '100000014';

    DEV_MODE && console.log('dev2, CHAIHONA_HOST = %s', window.CHAIHONA_HOST);
    DEV_MODE && console.log('PATH=%s', window.location.pathname);

    var ud = null;
    var priceObserver = null;
    // может поменяться при проверке адреса
    var delivery_min_sum = 1500;
    var delivery_cost = 0;
    var errorSet = new Set();

    if(window.location.pathname == '/' || window.location.pathname == '/shop') processRoot();
    else if(window.location.pathname == '/success') processSuccess();

    function processRoot(){

        let cssId = 'jQueryUI_CSS';  // you could encode the css path itself to generate id..
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
            DEV_MODE && console.log('ymaps or ymaps.suggest undefined, load script');
            let script = document.createElement('script');
            script.async = false;
            script.onload = onYmapsReady;
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=9cf52b96-70cc-4eab-81a3-53ffdd4850e2';
            document.head.appendChild(script);
        } else
            onYmapsReady();


        $('#root').show();

        // добавляю СКРЫТОЕ поле для города
        $('#form208707357').append('<input type="hidden" name="city" value="Москва"/>');


        ud = new UserData();

        priceObserver = new PriceObserver();

        if(ud.props.street && ud.props.house){
            // уже есть история - ищу рест
            checkAdress();
        }
       
        //TODO вывести информацию о невозможности оплаты онлайн - проверить

        // при входе на страницу скрываю блок с кнопкой "оплатить"
        // тильда походу не использует аттрибут action у кнопки submit, 
        // поэтому невозможно переопределить ее поведение
        $('#form208707357 div.t-form__submit').hide();

        // очищаю время доставки
        $("select[name='time']").empty();

        //01.10.2020 в поле телефон плейсхолдер +7(999)999-99-99, при фокусе автоматически вставлять +7
        ud.el('phone').attr('placeholder', '+7(999)999-99-99');
        ud.el('phone').focus(function(){
            if(this.value=='') this.value = '+7';
        });

        // тильда глючит - не пускает в редактирование CSS...
        // задаю стили для autocomplete
        let styleTag = $('<style>ul.ui-autocomplete { z-index: 999999; } div.ui-menu-item-wrapper {line-height: 2em;}</style>');
        $('html > head').append(styleTag);

        //01.10.2020 дефолтное время доставки
        //TODO при повторных вызовах проверять текущее значение
        setDeliveryTime('11:00-23:30', 60);

        // рисуем аналогичную кнопку для перехода на оплату в чайхону   
        $('#form208707357 div.t-form__inputsbox').append(`
            <div 
                id="chaihona_pay" 
                style="text-align:center;vertical-align:middle;height:100%;margin-top:30px;margin-bottom:10px;width:100%;">
                
                <button 
                    onclick="window.chaihona_pay_click();return false;"
                    style="font-family:'Manrope',Arial,sans-serif;text-align:center;height:60px;border:0 none;font-size:16px;padding-left:60px;padding-right:60px;font-weight:700;white-space:nowrap;background-image:none;cursor:pointer;margin:0;box-sizing:border-box;outline:none;background:transparent;position:relative;width:100%;color:#ffffff;background-color:#ff0044;border-radius:8px; -moz-border-radius:8px; -webkit-border-radius:8px;">
                    
                    Оплатить
                    
                </button>
                
            </div>`);


        // подписываюсь на события ухода с поля ввода адреса
        ud.el('street').blur(function(){ checkAdress(); });
        ud.el('house').blur(function(){ checkAdress(); });
        
        // при смене типа оплаты меняю текст кнопки
        $('input:radio[name="paymentsystem"]').change(function() {
            if( $(this).val()=='cash' ) $('#chaihona_pay button').text('Заказать');
            else $('#chaihona_pay button').text('Оплатить');
        });

        // скрываю блок со SKU, мне он нужен для идентификации блюд, но дизайнеру не нравится
        new ClassWatcher(
            document.getElementsByClassName('t706__cartwin')[0], 
            't706__cartwin_showed', 
            function(){
                // блюд может быть несколько
                $('div.t706__product').each(function(){
                    // SKU ПОКА последний div в куче
                    $('div.t706__product-title div:last', this).hide();
                });
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
            
            let phone = ud.el('phone');
            let purePhone = '';
            if(/^\+*[\d\(\)\-\s]+$/.test(phone.val())){
                purePhone = phone.val().replace(/[\(\)\+\s\-]/g, '');
                if(purePhone.length==11){
                    DEV_MODE && console.log('pure phone: %s', purePhone);
                    phone.parent().find('div.t-input-error').hide();
                    hideBottomError('js-rule-error-phone');
                } else
                    showError(phone, 'Неверная длина номера телефона, должно быть 11 цифр с кодом страны', 'js-rule-error-phone');
            } else 
                showError(phone, 'Неверный формат номера телефона', 'js-rule-error-phone');

            let name = ud.el('name');
            if(/^[\S\s]+$/.test(name.val())){
                name.parent().find('div.t-input-error').hide();
                hideBottomError('js-rule-error-name');
            } else 
                showError(name, 'Введите Ваше имя', 'js-rule-error-name');

            if(!ud.props.flat)
                showError(ud.el('flat'), 'Введите номер квартиры', 'js-rule-error-all');

            // из суммы вырезаем пробелы и сравниваем с delivery_min_sum
            let totalObj = $('span.t706__cartwin-prodamount');
            let totalMatches = totalObj.text().match(/([\s\d]+)/);
            let total = totalMatches[1].replace(/\s/g, '');
            if(parseInt(total)<delivery_min_sum)
                showError(null, `Минимальный заказ ${delivery_min_sum}&nbsp;₽`, 'js-rule-error-minorder');
            else
                hideBottomError('js-rule-error-minorder');
            
            if($('#chaihona_pay').attr('allow_pay') !== 'true')
                showError(null, 'Введите адрес доставки', 'js-rule-error-all');

            if (errorSet.size)
                return;
            
            let payment = $("#form208707357 input[name='paymentsystem']:checked").val();
            let department = $('#chaihona_pay').attr('department');
            let total_price = $('div.t706__cartwin-prodamount-wrap span.t706__cartwin-prodamount').text();
            let delivery_time = $("#form208707357 select[name='time']").val();
            
            let params=`<input type="hidden" name="phone" value="${purePhone}"/>
                <input type="hidden" name="name" value="${ud.props.name}"/>
                <input type="hidden" name="city" value="${ud.props.city}"/>
                <input type="hidden" name="street" value="${ud.props.street}"/>
                <input type="hidden" name="house" value="${ud.props.house}"/>
                <input type="hidden" name="flat" value="${ud.props.flat}"/>
                <input type="hidden" name="department" value="${department}"/>
                <input type="hidden" name="total" value="${total_price}"/>
                <input type="hidden" name="delivery_cost" value="${delivery_cost}"/>
                <input type="hidden" name="payment" value="${payment}"/>
                <input type="hidden" name="coment" value="${ud.props.coment}"/>
                <input type="hidden" name="delivery_time" value="${delivery_time}"/>
                <input type="hidden" name="brand" value="${window.BRAND_CODE}"/>`;

            let hasKalyan = false;

            $("div.t706__product").each(function(){
                let dish_name = $(this).find('div.t706__product-title a').text();
                dish_name = dish_name.replace(/\"/g, "'");
                
                if (dish_name.match(/кальян/i))
                    hasKalyan = true;

                // в эту же кучу добавился модификатор, SKU пока последним элементом
                let sku = $(this).find('div.t706__product-title div:last').text();

                // ищу модификатор, он рядом со SKU - отличается отсутствием стиля
                let modif = $('div.t706__product-title div:not([style*="opacity"])', this).text();

                let quantity = $(this).find('div.t706__product-plusminus span.t706__product-quantity').text();
                let total = $(this).find('div.t706__product-amount').text();
                params += `<input type="hidden" name="dish[]" value="${sku}|${dish_name}|${quantity}|${total}|${modif}"/>`;
            });

            if(!hasKalyan){
                showError(null, 'В заказе должен быть кальян', 'js-rule-error-all');
                return;
            }

            // запрет повторного клика
            $('#chaihona_pay').attr('processing','1');

            $(`<form action="${window.CHAIHONA_HOST}/eda-na-raione" method="POST">${params}</form>`).appendTo($(document.body)).submit();
        }

    }

    function processSuccess(){

    }

    function onYmapsReady(){
        DEV_MODE && console.log('ymaps ready');

        const moscowBound = [[55.142627, 36.803259],[56.021281, 37.967682]];

        $("input[name='street']").autocomplete({
            // вызывается при вводе более 3-х символов, список формирую из ответов яндекса
            source: async(request, response) => {
                let items = await ymaps.suggest(request.term, { boundedBy: moscowBound, results: 7 });
    
                let arrayResult = [];
                let arrayPromises = [];
    
                function pushGeoData(displayName, value, jsonData) {
                    arrayResult.push({displayName: displayName, value: value, jsonData: jsonData});
                }
    
                function getCustomHouse(value){
                    var result = value.match(/[0-9]{1,3}[0-9а-я\/]{1,4}/i);
                    if(result)
                        return result[0];
                    return "";
                }
    
                items.forEach((element) => {
                    if (!element.value.match(/.*подъезд.*/)) 
                    {
                        // можно и по одному await-ить, но параллельно быстрее
                        arrayPromises.push( ymaps.geocode(element.value).then(gc=>{
                            let displayName = "";
                            let value = element.value;
    
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
                                };
    
                                //jsonData.house.replace("undefined", "");
    
                                value = value.replace(geoObject.getCountry()+", ", "");
                                value = value.replace(geoObject.getAdministrativeAreas()[0]+", ", "");
                                value = value.replace("undefined", "");
                                // displayName = "<div class='yandex-map-address_info'>"+value+"</div><div class='yandex-map-localities_info'>"+geoObject.getCountry()+", "+geoObject.getLocalities()[0]+"</div>";
                                // displayName = displayName.replace("undefined", "");
    
                                pushGeoData(displayName, value, jsonData);
                            }
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
                // $("input[name='city']").val( ui.item.jsonData.city );
                // $("input[name='street']").val( ui.item.jsonData.street );
                // $("input[name='house']").val( ui.item.jsonData.house ); 

                if(ud){
                    ud.props.city = ui.item.jsonData.city;
                    ud.props.street = ui.item.jsonData.street;
                    ud.props.house = ui.item.jsonData.house;
                }

                // переопределяю выбор
                ui.item.value = ui.item.jsonData.street;
            },
            minLength: 3
        });
    }
   
    function pad(n){ return ('00' + n).slice(-2); }

    // функция проверки адреса
    async function checkAdress()
    {
        // если поля заполнены 
        if (ud.props.street && ud.props.house) {
            // и изменились

            // город заполняется отдельно
            //ud.props.city = ud.el('city').val();

            if (ud.props.street!=ud.props.oldStreet || ud.props.house!=ud.props.oldHouse) {
                let data = {
                    city: ud.props.city,
                    street: ud.props.street, 
                    house: ud.props.house,
                    brand: window.BRAND_CODE
                };

                // запоминаю предыдущие значения, чтобы не запрашивать, если ничего не поменялось
                ud.props.oldStreet = ud.props.street;
                ud.props.oldHouse = ud.props.house;

                // перед новым запросом гашу старую ошибку
                ud.el('street').parent().find('div.t-input-error').hide();
                
                hideBottomError('js-rule-error-minlength');
                hideBottomError('js-rule-error-string');

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
                        //TODO где-то вписать сумму доставки
                        // формирую выпадающий список "доставить к"
                        if(data.work_time){ 
                            setDeliveryTime(data.work_time, parseInt(data.delivery_time));

                            delivery_min_sum = data.delivery_min_sum;
                            delivery_cost = data.delivery_cost;
                            priceObserver.setDeliveryCost(delivery_cost);
                            
                            $('span:contains(Сумма:)').each(function(){
                                let text = "Сумма:&nbsp;";
                                if(delivery_cost>0)
                                    text = `Стоимость доставки:&nbsp;${delivery_cost}&nbsp;₽<br/>` + text;
                                $(this).html(text);
                            });

                            // показываю СВОЮ кнопку "оплатить"
                            //chaihona_pay.show();
                            chaihona_pay.attr('allow_pay', 'true');
                            if(!data.online_payment){
                                $("#form208707357 input[name='paymentsystem'][value='cash']").prop('checked', true);
                                $("#form208707357 input[name='paymentsystem'][value='cloudpayments']").attr("disabled",true);
                            
                                showError(null, 'Обслуживающий ресторан не поддерживает онлайн-оплату', 'js-rule-error-string');
                                //$('div.js-errorbox-all').show();
                            
                            }
                            chaihona_pay.attr('department', data.department);
                        }
                        else{
                            showError(null, 'В ответе сервера нет времени работы ресторана', 'js-rule-error-string');
                        }
                    }
                });
            }
        }
    }

    // показ ошибок в штатных местах - под полем и рядом с кнопкой оплатить
    function showError(element, errorText, bottomClass=null){
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
            $('p.t-form__errorbox-item.'+bottomClass).show();
            $('p.t-form__errorbox-item.'+bottomClass).html(errorText);
        }
        
        if(errorSet.size)
            $('div.js-errorbox-all').show();
    }
    
    function hideBottomError(bottomClass){
        $('p.t-form__errorbox-item.'+bottomClass).hide();
        errorSet.delete(bottomClass);
        
        if(errorSet.size==0)
            $('div.js-errorbox-all').hide();
    }
    
    // скрывает все ошибки при клике на "оплатить"
    function hideAllErrors(){
        $('p.t-form__errorbox-item').each(function(){
            $(this).hide();
        });
    }

    function setDeliveryTime(work_time, delivery_time){
        let select = $("select[name='time']");
        if(select){
            select.empty();

            let date = new Date();
            let tomorrow = (new Date()).setDate( date.getDate()+1 );

            let y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(date);
            let m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(date);
            let d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(date);

            let date_str = `${d}.${m}.${y}`;

            y = new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(tomorrow);
            m = new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(tomorrow);
            d = new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(tomorrow);

            let tomorrow_str = `${d}.${m}.${y}`;

            let match = work_time.match(/(\d+):(\d+)-(\d+):(\d+)/);
            
            if(match){
                let start_time = parseInt(match[1])*60 + parseInt(match[2]);
                let end_time = parseInt(match[3])*60 + parseInt(match[4]) + delivery_time;
                
                // переход через полночь
                if(end_time<start_time) end_time += 24*60;

                // к текущему времени сразу прибавляю время доставки
                let begin_time = date.getHours()*60 + date.getMinutes() + delivery_time;

                if(begin_time>start_time)
                    select.append(new Option('Как можно быстрее', 'now'));

                for (let i = start_time; i < end_time; i+=30){
                    if(i>=begin_time){
                        if(i<24*60)
                            select.append(new Option(
                                `${pad( Math.floor(i/60) )}:${pad( i%60 )}`, 
                                `${date_str} ${pad( Math.floor(i/60) )}:${pad( i%60 )}`));
                        else
                            select.append(new Option(
                                `${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`, 
                                `${tomorrow_str} ${pad( Math.floor((i-24*60)/60) )}:${pad( i%60 )}`));
                    }
                }
            }
        }
    }
});

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


class UserData {
    props = {
        _name: '',
        get name(){ 
            return decodeURIComponent( this._name );
        },
        set name(value){
            if(this._name != value){
                this._name = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='name']").val(this.name);
                document.cookie = `name=${this._name}; max-age=31536000`;
            }
        },
        _phone: '',
        get phone(){ 
            return decodeURIComponent( this._phone );
        },
        set phone(value){
            if(this._phone != value){
                this._phone = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='phone']").val(this.phone);
                document.cookie = `phone=${this._phone}; max-age=31536000`;
            }
        },
        _city: '',
        oldCity: '',
        get city(){
            return decodeURIComponent( this._city ); 
        },
        set city(value){
            if(this._city != value){
                //this.oldCity = this._city;
                this._city = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='city']").val(this.city);
                document.cookie = `city=${this._city}; max-age=31536000`;
            }
        },
        _street: '',
        oldStreet: '',
        get street(){ 
            return decodeURIComponent( this._street ); 
        },
        set street(value){
            if(this._street != value){
                //this.oldStreet = this._street;
                this._street = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='street']").val(this.street);
                document.cookie = `street=${this._street}; max-age=31536000`;
            }
        },
        _house: '',
        oldHouse: '',
        get house(){ 
            return decodeURIComponent( this._house );
        },
        set house(value){
            if(this._house != value){
                //this.oldHouse = this._house;
                this._house = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='house']").val(this.house);
                document.cookie = `house=${this._house}; max-age=31536000`;
            }
        },
        _flat: '',
        get flat(){
            return decodeURIComponent( this._flat );
        },
        set flat(value){
            if(this._flat != value){
                this._flat = encodeURIComponent( value.trim() );
                $("#form208707357 input[name='flat']").val(this.flat);
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
                $("#form208707357 textarea[name='coment']").val(this.coment);
                document.cookie = `coment=${this._coment}; max-age=31536000`;
            }
        }
    }
    
    /*
    связывает поле ввода (input) со свойством
    - при изменении записывается в куки
    - при создании считывает из куки
    */
    bindInput(propName, tag = 'input'){
        let value = $(`#form208707357 ${tag}[name='${propName}']`).val().trim();

        // если поле пустое, то считать из куки
        this.props[propName] = value ? value : this.getCookie( propName );

        // при выходе с элемента запоминаю значение в куку
        $(`#form208707357 ${tag}[name='${propName}']`).blur((event)=>{ 
            this.props[propName] = $(event.currentTarget).val();
        });
    }

    el(elementName, tag = 'input'){
        return $(`#form208707357 ${tag}[name='${elementName}']`);
    }

    constructor(){
        this.bindInput('phone');
        this.bindInput('name');
        this.bindInput('city');
        this.bindInput('street');
        this.bindInput('house');
        this.bindInput('flat');
        this.bindInput('coment', 'textarea');
    }

    getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : '';
    }
}

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
        this.observer.observe(this.targetNode, { attributes: true })
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
