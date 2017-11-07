/*
function getrMediaDetail(details) {
    for (let obj of details.responseHeaders) {
        if (obj.name.toLocaleLowerCase() === "content-type") {
            switch (obj.value) {
                case "video/mp4":
                case "video/x-flv":
                case "video/webm":
                case "audio/mpeg":
                case "audio/mp4":
                case "audio/x-m4a":
                case "application/octet-stream":
                    if (details.method === "GET") {
                        return details;
                    }
                    break;
            }
        }
    }
}

function getMediaSize(obj) {
    for (let o of obj) {
        if (o.name.toLocaleLowerCase() === "content-length") {
            return (o.value / 1024 / 1024).toFixed(2);
        }
    }
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "title": "Download",
        "contexts": ["all"],
        "id": "down"
    });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log(activeInfo)
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "loading") {
        this.tabId = tabId;

        chrome.contextMenus.remove("down", function () {
            chrome.contextMenus.create({
                "title": "Download",
                "contexts": ["all"],
                "id": "down"
            });
            this.obj = []
        })
    }
});

chrome.webRequest.onHeadersReceived.addListener(function (details) {
        let media = null;
        let size = 0;
        if (getrMediaDetail(details)) {
            media = getrMediaDetail(details);
            size = getMediaSize(media.responseHeaders);
            this.obj.push([details.requestId, media.url]);
            if (size > 0.2) {
                chrome.contextMenus.create({
                    "title": "(" + size + "MB)" + media.url,
                    "parentId": "down",
                    "contexts": ["all"],
                    "id": details.requestId
                });
            }
        }
    },
    {
        urls: ["<all_urls>"]
    },
    ["responseHeaders"]
);

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    for (let arr of this.obj) {
        if (arr[0] === info.menuItemId) {
            chrome.downloads.download({url: arr[1]});
        }
    }
});*/
chrome.runtime.onInstalled.addListener(function () {
});

chrome.tabs.onRemoved.addListener(function (tabId, info) {
    //console.log("删除标签");
    if (this.customMenu) {
        this.customMenu.splice(tabId, 1)
    }
});

chrome.tabs.onCreated.addListener(function (tab) {
    console.log("新键标签");
});

chrome.tabs.onActivated.addListener(function (tab) {
    console.log("切换标签");
    if (!this.down) {
        this.down = chrome.contextMenus.create({
            "title": "Download",
            "contexts": ["all"]
        });
    }
    if (this.customMenu) {
        if (!this.customMenu[tab.tabId]) {
            this.customMenu[tab.tabId] = [];
        }
    } else {
        this.customMenu = [];
        this.customMenu[tab.tabId] = [];
    }

    chrome.contextMenus.remove(this.down, function () {
        this.down = chrome.contextMenus.create({
            "title": "Download",
            "contexts": ["all"]
        }, function () {
            this.customMenu[tab.tabId].map(function (obj, i) {
                createChildMenu({size: obj.size, url: obj.url}, i.toString())
            })
        });
    })
});


chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    switch (info.status) {
        case "loading":
            console.log("刷新标签");
            if (!this.down) {
                this.down = chrome.contextMenus.create({
                    "title": "Download",
                    "contexts": ["all"]
                });
            }

            if (this.customMenu) {
                this.customMenu[tabId] = [];
            } else {
                this.customMenu = [];
                this.customMenu[tabId] = [];
            }

            chrome.contextMenus.remove(this.down, function () {
                this.down = chrome.contextMenus.create({
                    "title": "Download",
                    "contexts": ["all"]
                })
            });
            break;
        case "complete":
            if (chrome.webRequest.onHeadersReceived.hasListener(onHeadersReceivedCallBack)) {
                chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceivedCallBack);
            }
            chrome.webRequest.onHeadersReceived.addListener(
                onHeadersReceivedCallBack,
                {
                    urls: ["<all_urls>"],
                    types: ["media", "xmlhttprequest", "other"]
                },
                ["responseHeaders"]
            );
            break;
    }
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (this.customMenu[tab.id].length > 0) {
        chrome.downloads.download({url: this.customMenu[tab.id][info.menuItemId].url});
    }
});

function onHeadersReceivedCallBack(details) {
    let media = getrMediaDetail(details);
    if (media) {
        let size = getMediaSize(media.responseHeaders);
        if (media.tabId !== -1) {
            this.customMenu[media.tabId][media.requestId] = {size: size, url: media.url};
            createChildMenu({size: size, url: media.url}, media.requestId)
        }
    }
}

function createChildMenu(detail, menuId) {
    chrome.contextMenus.create({
        "title": "(" + detail.size + "MB)" + detail.url,
        "parentId": this.down,
        "contexts": ["all"],
        "id": menuId
    });
}

function getrMediaDetail(detail) {
    if (detail.method === "GET") {
        for (let obj of detail.responseHeaders) {
            if (obj.name.toLocaleLowerCase() === "content-type") {
                switch (obj.value) {
                    case "video/mp4":
                    case "video/x-flv":
                    case "video/webm":
                    case "video/MP2T":
                    case "application/octet-stream":
                    case "audio/mpeg":
                    case "audio/mp4":
                    case "audio/x-m4a":
                        return detail;
                        break;
                }
            }
        }
    }
}

function getMediaSize(obj) {
    for (let o of obj) {
        if (o.name.toLocaleLowerCase() === "content-length") {
            return (o.value / 1000 / 1000).toFixed(2);
        }
    }
}

function getMediaName(url) {
    let pattern = /(\w+:\/\/)(\w.+)\?.*/g;
    if (pattern.test(url)) {
        return url.match(pattern)[0].replace("?", "");
    } else {
        return url
    }
}

function getMediaURL(url) {

}