// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
   // "use strict";

    //image.src = "data:image/jpeg;base64," + imageData;
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    class Shop {
        constructor(id, name, desc, lat, lon, slika) {
            this.id = id;
            this.name = name;
            this.desc = desc;
            this.lat = lat;
            this.lon = lon;
            this.slika = slika;
        }

    }
    class Picture {
        constructor(id_pic,slika,id) {
            this.id_pic = id_pic;
            this.slika = slika;
            this.id = id;
        }

    }
    var slikaBool;
    var markeri;//cuva listu markera koja je trenutno prikazana (sem markera koji prikazuje vasu trenutnu poziciju)
    var pozicioniMarker;//marker koji pokazuje na trenutnu poziciju
    var currentLat;// trenutni latitude
    var currentLon;// trenutni longitude
    var prevLat;
    var prevLon
    var currentHeading;
    var map;//google mapa
    var imeMesta;
    var slikaMesta;
    var provera;
    var sopovi;//lista svih sopova
    var slike;//lista svih slikanih slika vezanih za sopove

    function onDeviceReady() {

        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
        slikaBool = false;
        provera = false;
        markeri = new Array();
        sopovi = new Array();
        slike = new Array();
        var mapOptions = {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map
               (document.getElementById("mapa"), mapOptions);
        var opcije = { enableHighAccuracy: true ,timeout:15000};

        navigator.geolocation.watchPosition(onLocationSuccess, onError,opcije);//posmatra trenutnu poziciju       
        var dive = document.getElementById("div1");
        dive.addEventListener("click", onClickSlika);
        document.getElementById("searchPic").addEventListener("click", goSearch);
        window.addEventListener("batterystatus", onBatteryStatus, false);
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(populateDBShop, errorCB, successCBShop);// onSuccessDB/successCBShop 
        db.transaction(populateDBPicture, errorCB, successCBPicture);
        document.getElementById("cameraPic").onclick=function()//klik na sliku kamera
        {
            navigator.camera.getPicture(onSuccessCamera, onFailCamera, {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                saveToPhotoAlbum: true
            });
        }
    };
    function getCurrentOrientation() {
        var ret;
        if ((currentHeading >= 0 && currentHeading <= 15) || (currentHeading <= 359.5 && currentHeading >= 345.5)) {
            ret = "istocno";
        }
        else if ((currentHeading > 15 && currentHeading < 75)) {
            ret = "severo-istocno";
        }
        else if ((currentHeading >= 75 && currentHeading <= 105)) {
            ret = "severno";
        }
        else if ((currentHeading > 105 && currentHeading < 165)) {
            ret = "severno-zapadno";
        }
        else if ((currentHeading >= 165 && currentHeading <= 195)) {
            ret = "zapadno";
        }
        else if ((currentHeading > 195 && currentHeading < 255)) {
            ret = "jugo-zapadno";
        }
        else if ((currentHeading > 255 && currentHeading <= 285)) {
            ret = "juzno";
        }
        else {
            ret = "jugo-istocno";
        }
        return ret;

    }
    function vehicleBearing(lat1, lon1, lat2, lon2) {

        function getAtan2(y, x) {
            return Math.atan2(y, x);
        };
        var radians = getAtan2((lon2 - lon1), (lat2 - lat1));

        var compassReading = radians * (180 / Math.PI);

        var coordNames = ["severno", "severo-istocno", "istocno", "jugo-istocno", "juzno", "jugo-zapadno", "zapadno", "severo-zapadno", "severno"];
        var coordIndex = Math.round(compassReading / 45);
        if (coordIndex < 0) {
            coordIndex = coordIndex + 8
        };

        return coordNames[coordIndex]; // returns the coordinate value
    }
    //racuna distancu u kilometrima izmedju tacaka lat1,lon1 i lat2,lon2
    function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 +
                c(lat1 * p) * c(lat2 * p) *
                (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
    function compassSuccess(heading) {
        currentHeading = heading.magneticHeading;

    }
    function onSuccessDB() {
        alert("uspesno ");
    }
    function onError() {
        alert("location error");
    }
    //vraca mapu sa centrom u latidute,longitude samo prvi put kad je provera == false,kad je provera == true samo postavlja marker a ne i centar mape 
    function getMap(latitude, longitude) {
     
        var latLong = new google.maps.LatLng(latitude, longitude);
        var marker = new google.maps.Marker({
            'position': latLong
        });
        marker.setMap(map);
        marker.setLabel("You are here");
        pozicioniMarker = marker;
        if (provera == false)
        {
            map.setCenter(latLong);
            map.setZoom(15);
            provera = true;
        }
    }
    //brise marker trenutne pozicije
    function ocistiTrenutniMarker()
    {
        if (pozicioniMarker != null)
        {
            pozicioniMarker.setMap(null);
        }
              
    }
    //nadgledanje pozicije
    function onLocationSuccess(position) {

        ocistiTrenutniMarker();
        prevLat = currentLat;
        prevLon = currentLon;
        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
        getMap(currentLat, currentLon);
        pushNot();

    }
    //poziva upit returnAlll
    function pushNot() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnAll);
    }
    //vraca sve iz shop ,ukoliko je uspesan upit prelazi se na onSuccessAll ukoliko ima gresku prelazi se na errorCB
    function returnAll(tx) {
        tx.executeSql("SELECT * FROM SHOP", [], onSuccessAll, errorCB);
    }
    //ukoliko je upit uspesan proverava da li je distanca trenutne lokacije i nekog od objekata iz baze manja od 0.2,ukoliko jeste salje notifikaciju
    function onSuccessAll(tx, results) {
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
            var lat = results.rows.item(i).lat;
            var lon = results.rows.item(i).lon;
            var dist = distance(currentLat, currentLon, lat, lon);
            var name = results.rows.item(i).name;
            var degre = getCurrentOrientation();
            if (dist <= 0.2) {
                // navigator.notification.beep(3);
                navigator.notification.alert(name + " je u krugu od 200m", function () { }, 'Obavestenje', ['Ok', 'Cancel']);
            }
        }
    }
    //proverava status baterija,ukoliko je manji od 20% i ukoliko nije stavljen na punjac salje notifikaciju
    function onBatteryStatus(info) {
        if(info.level < 20 && info.isPlugged != true)
        {
            navigator.notification.alert("Baterija je pri kraju!");
        }
    }
    //stvara dropDown meni klikom na sliku u levom gornjem uglu
    function onClickSlika() {
        if (slikaBool == false) {
            slikaBool = true;
            var div = document.getElementById("dropDown");
            var div1 = document.createElement("div");
            div1.setAttribute("id", "dropDownTrenutni");
            var lista = document.createElement("ul");

            var trzniCentri = document.createElement("li");
            var pijace = document.createElement("li");
            var namestaji = document.createElement("li");

            var trzniCentriPic = document.createElement("img");
            trzniCentriPic.src = "images/torba.png";
            trzniCentriPic.style.float = "right";
            trzniCentriPic.style.width = "30px";
            trzniCentriPic.style.height = "30px";
            trzniCentriPic.addEventListener("click", goReturnTC);
            var pijacePic = document.createElement("img");
            pijacePic.src = "images/pijaca.png";
            pijacePic.style.width = "30px";
            pijacePic.style.height = "30px";
            pijacePic.style.float = "right";
            pijacePic.addEventListener("click", goReturnP);
            var namestajiPic = document.createElement("img");
            namestajiPic.src = "images/namestaj.png";
            namestajiPic.style.width = "30px";
            namestajiPic.style.height = "30px";
            namestajiPic.style.float = "right";
            namestajiPic.addEventListener("click", goReturnSN);
            lista.style.alignItems = "left";
            trzniCentri.innerHTML = "Trzni centri";
            pijace.innerHTML = "Pijace";
            namestaji.innerHTML = "Saloni namestaja";

            trzniCentri.appendChild(trzniCentriPic);
            pijace.appendChild(pijacePic);
            namestaji.appendChild(namestajiPic);
            lista.appendChild(trzniCentri);
            lista.appendChild(pijace);
            lista.appendChild(namestaji);
            var combo = document.createElement("select");
            combo.setAttribute("id", "comboDest");
            for (var i = 0; i <= 5; i += 0.5) {
                opt = document.createElement("option");
                opt.innerHTML = i;
                combo.appendChild(opt);
            }
            var comboDesc = document.createElement("select");
            comboDesc.setAttribute("id", "comboDestDesc");
            var opt = document.createElement("option");
            opt.innerHTML = "Trzni centar";
            comboDesc.appendChild(opt);
            var opt1 = document.createElement("option");
            opt1.innerHTML = "Pijaca";
            comboDesc.appendChild(opt1);
            var opt2 = document.createElement("option");
            opt2.innerHTML = "Salon namestaja";
            comboDesc.appendChild(opt2);

            var dugmeTrazi = document.createElement("button");
            dugmeTrazi.innerHTML = "Search";
            dugmeTrazi.addEventListener("click", goSearchByDest);

            div1.appendChild(lista);
            div1.appendChild(combo);
            div1.appendChild(comboDesc);
            div1.appendChild(dugmeTrazi);
            div.appendChild(div1);

        }
        else {
            slikaBool = false;
            var div = document.getElementById("dropDownTrenutni");
            div.parentNode.removeChild(div);
        }
    }
    //pravi bazu podataka PICTURE ukoliko vec niije kreirana
    function populateDBPicture(tx) {
       // tx.executeSql('DROP TABLE PICTURE');
        tx.executeSql('CREATE TABLE IF NOT EXISTS PICTURE (id_pic integer primary key autoincrement,slika text,id integer)');
    }
    //pravi bazu podataka SHOP ukoliko vec niije kreirana
    function populateDBShop(tx) {
        //tx.executeSql('DROP TABLE SHOP');
        tx.executeSql('CREATE TABLE IF NOT EXISTS SHOP (id integer primary key, name text , desc text  , lat real , lon real , slika text )');
    }
    //izvrsava se ukoliko dodje do greske u radu sa bazom
    function errorCB(err) {
        alert("Error processing SQL: " + err.code);
    }

    function onFailCamera(message) {
        alert('Failed because: ' + message);
    }
    //=========================================================================
    function successCBShop() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(queryDBShop, errorCB);
    }
    function successCBPicture()
    {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(queryDBPicture, errorCB);
    }
    function onSuccessCamera(imageData) {
        
        var imageURI = imageData;//"data:image/jpeg;base64," + imageData;
        var najmanjiID = 1;
        var najmanjeRastojanje = distance(currentLat, currentLon, sopovi[0].lat, sopovi[0].lon);;
        var mesto = sopovi[0].name;
        //nalazenje objekta koji je najmanje udaljen od trenutne pozicije
        for (var i = 1; i < sopovi.length; i++) {
            var latPr = sopovi[i].lat;
            var lonPr = sopovi[i].lon;
            var rez = distance(currentLat, currentLon, latPr, lonPr);
            if (rez < najmanjeRastojanje) {
                najmanjeRastojanje = rez;
                najmanjiID = sopovi[i].id;
                mesto = sopovi[i].name;
            }
        }
        //ukoliko je daljina najmanje udaljenog objekta od trenutne pozicije veca od 1km ne snima sa
        if (najmanjeRastojanje > 1) {
            alert("slika se nece snimiti jer nista nije u blizini");
        }
        else {
            //ukoliko je manja pita se da li zelimo da snimimo sliku u tom objektu ako je odgovor da snimamo sliku u bazu
            var odgovor = confirm("Da li zelite da snimite sliku u mestu " + mesto + "?");
            if (odgovor)
            {
                var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
                db.transaction(function (tx) { tx.executeSql('INSERT INTO PICTURE(slika,id) values ("' + imageURI + '","' + najmanjiID + '")') }, errorCB, function () { alert("uspesno snimljeno") });
                slike.push(new Picture(1, imageURI, najmanjiID));
            }
               
        }

    }
    //upit koji vraca sve sopove
    function queryDBShop(tx) {
        tx.executeSql('SELECT * FROM SHOP', [], querySuccess, errorCB);

    }
    //upit koji vraca sve slike
    function queryDBPicture(tx) {
        tx.executeSql('SELECT * FROM PICTURE', [], querySuccessPicture, errorCB);

    }
    //cisti sve elemente liste iz baze 
    function ocistiListu() {
        var lista = document.getElementById("listaIzBaze");
        var fc = lista.firstChild;

        while (fc) {
            lista.removeChild(fc);
            fc = lista.firstChild;
        }
    }
    //vraca sve sopove iz baze,ukoliko je broj sopova =0(znaci prvi put pokrecemo aplikaciju) ubacujemo u bazu 9 sopa ,ukoliko nije punimo niz sopovi
    function querySuccess(tx, results) {
        ocistiListu();
        var len = results.rows.length;
        if (len == 0) {
            goInsert();
        }
        else {
            for (var i = 0; i < len; i++) {
                var resId = results.rows.item(i).id;
                var resName = results.rows.item(i).name;
                var resDesc = results.rows.item(i).desc;
                var resLat = results.rows.item(i).lat;
                var resLon = results.rows.item(i).lon;
                var resSlika = results.rows.item(i).slika;
                sopovi.push(new Shop(resId, resName, resDesc, resLat, resLon, resSlika));
            }
        }
    }
    //ubacujemo u niz slike sve slike iz baze
    function querySuccessPicture(tx, results) {
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {

            var idSl = results.rows.item(i).id_pic;
            var ref = results.rows.item(i).id;
            var slika = results.rows.item(i).slika;
            slike.push(new Picture(idSl, slika, ref));
        }
    }
    //staticko ubacivanje sopova
    function insertDBShop(tx) {
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (1,"Roda","Trzni centar",43.323298, 21.925868,"images/roda.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (2,"Stop shop","Trzni centar",43.310963, 21.936695,"images/stopshop.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (3,"Forum","Trzni centar",43.318650, 21.894915,"images/forum.jpg")');



        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (4,"Simpo","Salon namestaja",43.318851, 21.909076,"images/simpo.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (5,"Jysk","Salon namestaja",43.312993, 21.934805,"images/jysk.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (6,"Home plus","Salon namestaja",43.313701, 21.935482,"images/homeplus.jpg")');

        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (7,"Cvetna pijaca","Pijaca",43.324089, 21.893985,"images/cvetna.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (8,"Zelena pijaca","Pijaca",43.324978, 21.892505,"images/zelena.jpg")');
        tx.executeSql('INSERT INTO SHOP (id,name,desc,lat,lon,slika) VALUES (9,"Paliluska pijaca","Pijaca",43.312792, 21.898261,"images/paliluska.jpg")');
    }

    function goInsert() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(insertDBShop, errorCB, successCBShop);
    }
    
    //cisti sve marker sem markera koji oznacava trenutnu poziciju
    function ocistiMarkere()
    {
        var len = markeri.length;
        for(var i=0;i<len;i++)
        {
            var markr = markeri[i];
            markr.setMap(null);
        }
    }
    //popunjava listu sa slikom i imenom sopa i omogucaa da kad se klikne na sliku objekta centar mape se postavi u tom objektu
    function popuniListu(ime,slika,lat,lon)
    {
        if(slika != null && ime != null)
        {
            var lis = document.getElementById("listaIzBaze");
            var el = document.createElement("li");
            el.style.borderBottom = "2px solid #F5F5F5";
            var imgEl = document.createElement("img");
            var ime1 = document.createElement("p");
            var distanca = document.createElement("p");
            var latLong = new google.maps.LatLng(lat, lon);
            var udaljenost = distance(currentLat, currentLon, lat, lon);
            distanca.innerHTML = "Trenutna udaljenost: "+udaljenost.toString()+"km";
            ime1.innerHTML = ime;
            imgEl.src = slika;
            imgEl.style.width = "65px";
            imgEl.style.height = "65px";
            imgEl.addEventListener("click", function () { map.setCenter(latLong); });
            el.appendChild(ime1);
            el.appendChild(imgEl);
            el.appendChild(distanca);
            lis.appendChild(el);
            

        }

    }
    //klik na marker bi trebao da izlista sve slike koje su vezane za taj sop gde je postavljen marker
    function onMarkerClick(marker)
    {
        var title = this.getTitle();
        ocistiListu();
        var brojac = true;
        var postojeSlike = false;
        var el = document.getElementById("listaIzBaze");
        var naslov = document.createElement("h2");
        for(var i=0;i<slike.length;i++)
        {
            var idS = slike[i].id;
            var slika = slike[i].slika;
           
            
          
            if(idS==title)
            {
                postojeSlike = true;
                naslov.innerHTML = "Vase slike u mestu " + getMesto(idS);
                if (brojac == true)
                {
                    el.appendChild(naslov);
                    brojac = false;
                }                   
                var slik = document.createElement("img");
                slik.style.width = "120px";
                slik.style.height = "120px";
                slik.style.marginLeft = "30px";
                slik.src = slika;        
                el.appendChild(slik);   
      
            }
        }
        if(postojeSlike == false)
        {
            naslov.innerHTML = "Nema slika u mestu" + getMesto(title);
            el.appendChild(naslov);
        }
    }
    //vraca ime objekta ciji je ID = idMesta
    function getMesto(idMesta)
    {
        var ime = "";
        for(var i=0;i<sopovi.length;i++)
        {
            if (sopovi[i].id == idMesta)
            {
                ime = sopovi[i].name;
                return ime;
            }
               
        }
    }
    //ukoliko su upiti trazenja (svi sem upita po daljini) uspesni izvrsava se sledeca funkcija
    function selectSuccess(tx, results) {
        ocistiListu();
        var len = results.rows.length;
        ocistiMarkere();
        for (var i = 0; i < len; i++) {
            var lat = results.rows.item(i).lat;
            var id = results.rows.item(i).id;
            var lon = results.rows.item(i).lon;
            var latLong = new google.maps.LatLng(lat, lon);
            var nam = results.rows.item(i).name;
            var imgSrc = results.rows.item(i).slika;
            imeMesta = nam;
            slikaMesta = imgSrc;
            popuniListu(nam, imgSrc,lat,lon);
            var marker = new google.maps.Marker({
                position: latLong,
                label: nam
            });
            var title = id.toString();
            marker.setTitle(title);
            marker.setMap(map);
            markeri.push(marker);
            marker.addListener("click", onMarkerClick);


        }
    }
    //ukoliko je upit trazi po daljini uspesan izvrsava se sledeca funckija
    function selectSuccessDest(tx, results) {
        ocistiListu();
        var len = results.rows.length;
        var e = document.getElementById("comboDest");
        var selDst = e.options[e.selectedIndex].value;
        var e1 = document.getElementById("comboDestDesc");
        var selDst1 = e1.options[e1.selectedIndex].value;
        ocistiMarkere();
        for (var i = 0; i < len; i++) {
            var lat = results.rows.item(i).lat;
            var lon = results.rows.item(i).lon;
            var desc = results.rows.item(i).desc;

            var des = distance(lat, lon, currentLat, currentLon);

            if (des <= selDst && selDst1 == desc) {
                var id = results.rows.item(i).id;
                var nam = results.rows.item(i).name;
                var sl = results.rows.item(i).slika;
                popuniListu(nam, sl,lat,lon);
                var latLong = new google.maps.LatLng(lat, lon);
                var marker = new google.maps.Marker({
                    position: latLong
                
                });
                marker.setTitle(id);
                marker.setMap(map);
                markeri.push(marker);
            }
        }
    }
    //UPITI
    function returnTrzniCentri(tx) {
        tx.executeSql('SELECT * FROM SHOP WHERE desc="Trzni centar"', [], selectSuccess, errorCB);
    }
    function returnPijace(tx) {
        tx.executeSql('SELECT * FROM SHOP WHERE desc="Pijaca"', [], selectSuccess, errorCB);
    }
    function returnSaloniNamestaja(tx) {
        tx.executeSql('SELECT * FROM SHOP WHERE desc="Salon namestaja"', [], selectSuccess, errorCB);
    }
    function returnSearch(tx) {
        var val = document.getElementById("searchInput").value;
        tx.executeSql("SELECT * FROM SHOP where name like ('%" + val + "%')", [], selectSuccess, errorCB);
    }
    function returnSearchDest(tx) {
        tx.executeSql("SELECT * FROM SHOP", [], selectSuccessDest, errorCB);
    }
    function goReturnTC() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnTrzniCentri);
    }
    function goReturnP() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnPijace);
    }
    function goReturnSN() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnSaloniNamestaja);
    }
    function goSearch() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnSearch);
    }
    function goSearchByDest() {
        var db = window.openDatabase("Database", "1.0", "Cordova Demo", 200000);
        db.transaction(returnSearchDest);
    }
    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();