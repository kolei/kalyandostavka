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

# Changelog

## 0.5

- ``ymaps.geocode`` тоже ограничиваю по координатам
- проверяю изменился ли адрес перед запросом ресторана