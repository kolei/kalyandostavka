# CDN скрипт для кальянного сервиса

Скрипт автоматически подтягивает нужные зависимости (яндекс карты и jquery ui)

## Установка

В заголовок страницы в тильде вставить 

```html
<script>    
    $(document).ready(function (){
        $.ajax({
            url: 'https://raw.githubusercontent.com/kolei/kalyandostavka/master/js/kalyan.js',
            crossDomain: true,
            cache: false, 
            type: 'GET'
        }).done(function(rawData){
            let script = document.createElement("script");
            script.text = rawData;
            document.body.appendChild(script);
        });
    });
</script>    
```

,где **master** - название ветки в репозитории

# TODO

- SKU вылазит

# Changelog

## 1.2

- нижний список ошибок убрал, перемещаюсь на первую найденную ошибку

## 1.1 (релиз)

- поменял время работы по-умолчанию
- добавил обработку ошибки "не введен дом"
- в загрузчике ветку выбираю по хосту

## 1.0

- переделал на загрузку скрипта с github по веткам

## 0.5

- ``ymaps.geocode`` тоже ограничиваю по координатам
- проверяю изменился ли адрес перед запросом ресторана