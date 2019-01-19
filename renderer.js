// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fs = require('fs');
var path = require('path');

var WebTorrent = require('webtorrent');
var client = new WebTorrent();

var syncToDrive=()=>fs.writeFileSync("./data.json", JSON.stringify(data), 'utf8');
var readFromDrive=()=>JSON.parse(fs.readFileSync('./data.json','utf8'));
var createData=()=>fs.existsSync('./data.json') ? false : fs.writeFileSync("./data.json", JSON.stringify({warning: "Editing this file could mess up nobstorrent. So, please don't! If you do, just delete this file.", path: __dirname, torrents:[]}), "utf8");

var log = x=>console.log(x);
var bytesToSize = (a,b)=>{if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

function torrentHandler(id) {
    return torrent => {
        log ("handler called");
        var tPath = torrent.path;
        var li = document.querySelector("li.torrent[data-id=\"" + id + "\"]");
        var elems = {
            li,
            name: li.getElementsByClassName("torrent-name")[0],
            statusIcon: li.getElementsByClassName("torrent-icon-status")[0],
            statusText: li.getElementsByClassName("torrent-text-status")[0],
            directionIcon: li.getElementsByClassName("torrent-icon-direction")[0],
            directionText: li.getElementsByClassName("torrent-text-direction")[0],
            pauseButton: li.getElementsByClassName("torrent-pause")[0]
        };

        function updateState(n) {
           data.torrents[id].state = n;
           syncToDrive();
        }
        function getState(){
            return data.torrents[id].state;
        }

        function pause(){
            log("pausing")
            torrent.destroy(function(){log("destroyed")});
            elems.statusIcon.className = "torrent-icon-status";
            elems.directionIcon.className = "torrent-icon-direction";
            elems.statusText.innerText = "";
            elems.directionText.innerText = "";
            data.torrents[id].paused = true;
            syncToDrive();
        }
        function resume(){
            data.torrents[id].paused = false;
            log ("resuming")
            if (data.torrents[id].state == "downloading") {
                log("dl")
                client.add(data.torrents[id].data, {path:data.torrents[id].path}, torrentHandler(id));
            } else if (data.torrents[id].state == "seeding") {
                log("seed")
                client.seed(tPath, torrentHandler(id));
            }
            elems.statusIcon.className = "torrent-icon-status fas fa-spinner spinning";
            syncToDrive();
        }
        function paused() {
            return data.torrents[id].paused;
        }

        paused() ? pause() : false;

        !paused() ? elems.statusIcon.className = "torrent-icon-status fas fa-spinner spinning" : false;
    
        torrent.on('download', function () {
            if (getState() != "downloading") return;
    
            if (elems.statusIcon.className != "torrent-icon-status fas fa-spinner spinning") elems.statusIcon.className = "torrent-icon-status fas fa-spinner spinning";
            if (elems.directionIcon.className != "torrent-icon-direction fas fa-arrow-alt-circle-down") elems.directionIcon.className = "torrent-icon-direction fas fa-arrow-alt-circle-down";
            if (elems.name.innerText == "" && torrent.metadata) {
                data.torrents[id].name = torrent.name;
                elems.name.innerText = data.torrents[id].name;
                syncToDrive();
            }
    
            elems.statusText.innerText = Math.floor(torrent.progress*100) + "%";
            elems.directionText.innerText = bytesToSize(torrent.downloadSpeed) + "/s";
            //elements.status.innerHTML = '<i class="fas fa-spinner spinning"></i> ' + percent + ' <i class="fas fa-arrow-alt-circle-down"></i> ' + speed;
        })
        
        torrent.on('upload', function () {
            if (getState() != "seeding") return;
    
            if (elems.statusIcon.className != "torrent-icon-status fas fa-seedling") elems.statusIcon.className = "torrent-icon-status fas fa-seedling";
            if (elems.directionIcon.className != "torrent-icon-direction fas fa-arrow-alt-circle-up") elems.directionIcon.className = "torrent-icon-direction fas fa-arrow-alt-circle-up";
            if (elems.name.innerText == "" && torrent.metadata) {
                data.torrents[id].name = torrent.name;
                elems.name.innerText = data.torrents[id].name;
                syncToDrive();
            }
    
            elems.statusText.innerText = bytesToSize(torrent.uploaded);
            elems.directionText.innerText = bytesToSize(torrent.uploadSpeed) + "/s";
        })

        torrent.on('done', function() {
            log("done!")
            updateState("seeding")

            if (elems.statusIcon.className != "torrent-icon-status fas fa-seedling") elems.statusIcon.className = "torrent-icon-status fas fa-seedling";
            if (elems.directionIcon.className != "torrent-icon-direction fas fa-arrow-alt-circle-up") elems.directionIcon.className = "torrent-icon-direction fas fa-arrow-alt-circle-up";
            if (elems.name.innerText == "" && torrent.metadata) {
                data.torrents[id].name = torrent.name;
                elems.name.innerText = data.torrents[id].name;
                syncToDrive();
            }
    
            elems.statusText.innerText = bytesToSize(torrent.uploaded);
            elems.directionText.innerText = "0B/s";

            client.seed(torrent.path, torrentHandler(id));
        });

        if (!data.torrents[id].paused) {
            if (data.torrents[id].state == "downloading") {
                if (elems.statusIcon.className != "torrent-icon-status fas fa-spinner spinning") elems.statusIcon.className = "torrent-icon-status fas fa-spinner spinning";
                if (elems.directionIcon.className != "torrent-icon-direction fas fa-arrow-alt-circle-down") elems.directionIcon.className = "torrent-icon-direction fas fa-arrow-alt-circle-down";
                elems.statusText.innerText = Math.floor(torrent.progress*100) + "%";
                elems.directionText.innerText = bytesToSize(torrent.downloadSpeed) + "/s";
            }
    
            if (data.torrents[id].state == "seeding") {
                if (elems.statusIcon.className != "torrent-icon-status fas fa-seedling") elems.statusIcon.className = "torrent-icon-status fas fa-seedling";
                if (elems.directionIcon.className != "torrent-icon-direction fas fa-arrow-alt-circle-up") elems.directionIcon.className = "torrent-icon-direction fas fa-arrow-alt-circle-up";
                elems.statusText.innerText = bytesToSize(torrent.uploaded);
                elems.directionText.innerText = bytesToSize(torrent.uploadSpeed) + "/s";
            }
        }

        elems.pauseButton.onclick = function() {
            paused() ? resume() : pause();
            elems.pauseButton.className = "torrent-pause " + (paused() ? "fas fa-play" : "fas fa-pause");
        }
    }
}

var createTorrent=(d,p)=>{var x = data.torrents.push({data:d,path:p,state:"downloading",paused:false});syncToDrive();return x;}
var addTorrent=(d,p,i)=>client.add(d, {path:p}, torrentHandler(i));
var addTorrentVis=(t,i)=>{
    var list = document.getElementById("torrents");
    var elem = document.createElement("li");
    elem.classList.add("torrent");
    elem.dataset.id = i;
    elem.innerHTML='<span class="torrent-name">' + (t.name ? t.name : "") + '</span> <i class="torrent-icon-status"></i> <span class="torrent-text-status"></span> <i class="torrent-icon-direction"></i> <span class="torrent-text-direction"></span> <span class="fright"><i class="' + ("torrent-pause " + (t.paused ? "fas fa-play" : "fas fa-pause")) +'"></i></span>';
    document.getElementById("torrents").appendChild(elem);
}

createData();
var data = readFromDrive();

data.torrents.forEach(function (t, i) {
    addTorrentVis(t, i);
    addTorrent(t.data, t.path, i);
});

var addModal = document.getElementById('addModal');
var openBtn = document.getElementById("addTorrent");
var addClose = document.getElementsByClassName("close")[0];
var addBtn = document.getElementById("addDone");

// When the user clicks on the button, open the modal 
openBtn.onclick = function() {
    addModal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
addClose.onclick = function() {
    addModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == addModal) {
        addModal.style.display = "none";
    }
}

addBtn.onclick = function() {
    var src = null;
    var magnet = document.getElementById("addLink").value;
    var file = document.getElementById("addFile").value;
    if (magnet != "") src = magnet;
    if (file != "") src = file;
    if (!src) {
        alert("Please provide a magnet link or a file path.");
        addModal.style.display = "none";
        return;
    }

    log (src);

    var path = document.getElementById("addPath").value;
    if (path != "") {
        data.dir = path;
        syncToDrive();
    }

    var i = createTorrent(src, data.dir)-1;
    var t = data.torrents[i];
    addTorrentVis(t, i);
    addTorrent(t.data, t.path, i);
    addModal.style.display = "none";
}

document.getElementById("addPath").value = data.path;

/*document.getElementById("example").onclick = function() {
    var i = createTorrent('magnet:?xt=urn:btih:57537d93a76f574369dc2e573e99c3840a9fd89d&dn=Hunter.Killer.2018.1080p.WEBRip.x264-MP4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969', './')-1;
    var t = data.torrents[i];
    addTorrentVis(t, i);
    addTorrent(t.data, t.path, i);
}*/

/*var torrentId = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';

var elements = {
    logBox: document.getElementById('log'),
    button: document.getElementById('button'),
    status: {
        icon1: document.getElementById('status-icon1'),
        text1: document.getElementById('status-text1'),
        icon2: document.getElementById('status-icon2'),
        text2: document.getElementById('status-text2')
    }
};

var log = x=>{console.log(x);elements.logBox.innerText+=x+"\n";}

function torrentHandler(torrent) {
    var status = "";
    torrent.on('download', function () {
        if (status != "downloading") {status = "downloading";log(status)}

        if (elements.status.icon1.className != "fas fa-spinner spinning") elements.status.icon1.className = "fas fa-spinner spinning";
        if (elements.status.icon2.className != "fas fa-arrow-alt-circle-down") elements.status.icon2.className = "fas fa-arrow-alt-circle-down";

        var percent = Math.floor(torrent.progress*100) + "%";
        var speed = bytesToSize(torrent.downloadSpeed) + "/s"

        elements.status.text1.innerText = percent;
        elements.status.text2.innerText = speed;
        //elements.status.innerHTML = '<i class="fas fa-spinner spinning"></i> ' + percent + ' <i class="fas fa-arrow-alt-circle-down"></i> ' + speed;
    })
    torrent.on('upload', function () {
        if (status != "uploading") {status = "uploading";log(status)}

        if (elements.status.icon1.className != "fas fa-seedling") elements.status.icon1.className = "fas fa-seedling";
        if (elements.status.icon2.className != "fas fa-arrow-alt-circle-up") elements.status.icon2.className = "fas fa-arrow-alt-circle-up";

        log("seeding");

        var speed = bytesToSize(torrent.uploadSpeed) + "/s";
        elements.status.text2.innerText = speed;
        elements.status.text1.innerText = bytesToSize(torrent.uploaded);
    })
    torrent.on('done', function() {
        log("done!")
        if (elements.status.icon1.className != "fas fa-seedling") elements.status.icon1.className = "fas fa-seedling";
        if (elements.status.icon2.className != "fas fa-arrow-alt-circle-up") elements.status.icon2.className = "fas fa-arrow-alt-circle-up";

        elements.status.text1.innerText = bytesToSize(torrent.uploaded);
        elements.status.text2.innerText = "0B/s";

        client.seed(torrent.path, torrentHandler);
    });
}

client.on('error',x=>log.innerText+=x);

elements.button.onclick = function() {
    log("Started.\n");
    client.add(torrentId, {path: "D:\\Projects\\nobstorrent\\"}, torrentHandler);
}*/