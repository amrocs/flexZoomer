/* ------------------------------------------------
 *  FlexZoomer      by Takashi Tanaka
 *      
 *      javascript scrolling and zooming library like Google Map.
 *      
 *      License: MIT License
 *      Dependencies: jquery, jquery.mousewheel
 * 
 * --------------------------------
 * プレフィックスがない pos は tilePos(タイル位置) である。
 * タイル位置とは、左から数えて何番目のタイルか(X位置)、
 * 上から数えて何番目のタイルか(Y位置)、のことを言う
 * 
 * 2014.02.20 [bug] preloadが1以外の場合はうまく動作しない
 * */
//------------------------------------------------
var FlexZoomer = function(attrs){
    //------------------------------------------------
    // Tile Object
    //------------------------------------------------
    var Vtile = function(arg){ // arguments: pos, posOffset, size, drawFunc, bkview
        var tile = {};
        
        //------------------------------------------------
        tile.zoomInAnim = function(){
            tile.div.animate({
                width: tile.size.w * 2,
                height: tile.size.h * 2,
            }, 500);
        };
        
        //------------------------------------------------
        tile.draw = function(){
            tile.drawFunc(tile);
        };
        
        //------------------------------------------------
        tile.remove = function(){
            tile.div.remove();
        };
        
        //------------------------------------------------
        tile.setPos = function(pos){
            tile.pos = pos;
        };
        
        //------------------------------------------------
        // generate a tile
        if(arg.pos){
            var sign = function(val){
                if(val < 0){
                    return "-";
                }else{
                    return "+";
                }
            }
            var str_pos_x = sign(arg.pos.x) + ("000" + Math.abs(arg.pos.x)).substr(-4);
            var str_pos_y = sign(arg.pos.y) + ("000" + Math.abs(arg.pos.y)).substr(-4);
        }
        
        tile.pos = arg.pos;
        tile.size = arg.size;
        tile.drawFunc = arg.drawFunc;
        tile.div = $("<div>").appendTo(arg.bkview)
            .attr("id", "tile_x" + str_pos_x + "_y" + str_pos_y)
            .attr("class", "tile")
            .attr("width", tile.size.w)
            .attr("height", tile.size.h)
            .css("width", tile.size.w)
            .css("height", tile.size.h)
            .css("overflow", "hidden")
            .css("position", "absolute")
            .css("left", tile.size.w * (tile.pos.x - arg.posOffset.x))
            .css("top", tile.size.h * (tile.pos.y - arg.posOffset.y));
        
        return tile;
    };





    //------------------------------------------------
    // Tile Matrix Object
    //------------------------------------------------
    var Vtmx = function(arg){ // arguments: viewSize, tileSize, preload, range, drawFunc, zoomInFunc, zoomOutFunc
        var tiles = [];
        
        //------------------------------------------------
        var copyRow = function(dst, src){
            for(var i = 0; i < tiles.count.x; i++){
                tiles[dst][i] = tiles[src][i];
            }
        };
        
        //------------------------------------------------
        var copyCol = function(dst, src){
            for(var i = 0; i < tiles.count.y; i++){
                tiles[i][dst] = tiles[i][src];
            }
        };
        
        //------------------------------------------------
        var removeRow = function(dst){
            for(var i = 0; i < tiles.count.x; i++){
                tiles[dst][i].remove();
                tiles[dst][i] = null;
            }
        };
        
        //------------------------------------------------
        var removeCol = function(dst){
            for(var i = 0; i < tiles.count.y; i++){
                tiles[i][dst].remove();
                tiles[i][dst] = null;
            }
        };
        
        //------------------------------------------------
        var drawRow = function(dst){
            for(var i = 0; i < tiles.count.x; i++){
                tiles[dst][i].draw();
            }
        };
        
        //------------------------------------------------
        var drawCol = function(dst){
            for(var i = 0; i < tiles.count.y; i++){
                tiles[i][dst].draw();
            }
        };
        
        //------------------------------------------------
        var newRow = function(dst, pos_y){
            for(var i = 0; i < tiles.count.x; i++){
                tiles[dst][i] = makeTile({x : tiles[dst][i].pos.x, y : pos_y});
                tiles[dst][i].draw();
            }
        };
        
        //------------------------------------------------
        var newCol = function(dst, pos_x){
            for(var i = 0; i < tiles.count.y; i++){
                tiles[i][dst] = makeTile({x : pos_x, y : tiles[i][dst].pos.y});
                tiles[i][dst].draw();
            }
        };
        
        //------------------------------------------------
        //ViewのLeftから見たタイルのLeft位置(X) →はみ出し判定に利用
        var getTileLeftFromView = function(tile){
            var bk_left = parseInt(tiles.bkview.css("left"), 10);
            var tile_left = (tile.pos.x - tiles.posOffset.x) * tile.size.w;
            
            return bk_left + tile_left;
        };
        
        //------------------------------------------------
        //ViewのTopから見たタイルのTop位置(Y) →はみ出し判定に利用
        var getTileTopFromView = function(tile){
            var bk_top = parseInt(tiles.bkview.css("top"), 10);
            var tile_top = (tile.pos.y - tiles.posOffset.y) * tile.size.h;
            
            return bk_top + tile_top;
        };
        
        //------------------------------------------------
        //determin tiles are pushed out or not. はみ出し判定
        var isPushedOut = function(direction){
            var target;  //判定に使うタイル
            var over_pixel;  //タイルがViewからどれだけはみ出しているか
            var limit;  //はみ出し判定値
            
            switch(direction){
                case "left":
                    target = tiles[0][0];
                    over_pixel = 0 - (getTileLeftFromView(target) + target.size.w);
                    limit = target.size.w * tiles.preload;
                    //console.log("Left pushed out pixels" + over_pixel);
                    break;
                case "right":
                    target = tiles[0][tiles.count.x - 1];
                    over_pixel = getTileLeftFromView(target) - tiles.viewSize.w;
                    limit = target.size.w * tiles.preload;
                    //console.log("Right pushed out pixels" + over_pixel);
                    break;
                case "top":
                    target = tiles[0][0];
                    over_pixel = 0 - (getTileTopFromView(target) + target.size.h);
                    limit = target.size.h * tiles.preload;
                    //console.log("Upper pushed out pixels" + over_pixel);
                    break;
                case "bottom":
                    target = tiles[tiles.count.y - 1][0];
                    over_pixel = getTileTopFromView(target) - tiles.viewSize.h;
                    limit = target.size.h * tiles.preload;
                    //console.log("Lower pushed out pixels" + over_pixel);
                    break;
            }
            
            if(over_pixel >= limit){
                return true;
            }else{
                return false;
            }
        };
        
        //------------------------------------------------
        //Horizontal tile slide. Now, only +1 or -1.
        var slideTileHorizontal = function(direction){
            var start_x;
            var end_x;
            var delta;
            
            if(direction < 0){
                start_x = 0;
                end_x = tiles.count.x - 1;
                delta = +1;
            }else{
                start_x = tiles.count.x - 1;
                end_x = 0;
                delta = -1;
            }
            
            for(var j = start_x; ; j += delta){
                if(j === start_x){
                    removeCol(j);
                    copyCol(j, j+delta);
                }else if(j === end_x){
                    newCol(j, tiles[0][j].pos.x + delta);
                    drawCol(j);
                    break;
                }else{
                    copyCol(j, j+delta);
                }
            }
        };

        //------------------------------------------------
        //Vertical tile slide. Now, only +1 or -1.
        var slideTileVertical = function(direction){
            var start_y;
            var end_y;
            var delta;
            
            if(direction < 0){
                start_y = 0;
                end_y = tiles.count.y - 1;
                delta = +1;
            }else{
                start_y = tiles.count.y - 1;
                end_y = 0;
                delta = -1;
            }
            
            for(var i = start_y; ; i += delta){
                if(i === start_y){
                    removeRow(i);
                    copyRow(i, i+delta);
                }else if(i === end_y){
                    newRow(i, tiles[i][0].pos.y + delta);
                    break;
                }else{
                    copyRow(i, i+delta);
                }
            }
        };
        
        //------------------------------------------------
        //generate a tile
        var makeTile = function(pos){
            draw_f = tiles.drawFunc;
            
            return new Vtile({
                pos: {x : pos.x, y : pos.y},
                posOffset: tiles.posOffset,
                size: tiles.tileSize,
                drawFunc: draw_f,
                bkview: tiles.bkview
            });
        };
        
        //------------------------------------------------
        // interface
        //------------------------------------------------
        //update tiles. (add scroll-in tiles, and delete scroll-out tiles)
        tiles.update = function(){
            while(isPushedOut("left")){
                slideTileHorizontal(-1);
            }
            while(isPushedOut("right")){
                slideTileHorizontal(+1);
            }
            while(isPushedOut("top")){
                slideTileVertical(-1);
            }
            while(isPushedOut("bottom")){
                slideTileVertical(+1);
            }
        };
        
        //------------------------------------------------
        // ZoomIn animation of all tiles(experimental)
        tiles.zoomInAnim = function(){
            for(var i = 0; i < tiles.count.y; i++){
                for(var j = 0; j < tiles.count.x; j++){
                    tiles[i][j].zoomInAnim();
                    //tiles[i][j] = null;
                }
            }
        };
        
        //------------------------------------------------
        // remove all tiles
        tiles.removeAll = function(){
            for(var i = 0; i < tiles.count.y; i++){
                for(var j = 0; j < tiles.count.x; j++){
                    tiles[i][j].remove();
                    tiles[i][j] = null;
                }
            }
        };
        
        //------------------------------------------------
        // draw all tiles
        tiles.draw = function(){
            for(var i = 0; i < tiles.count.y; i++){
                for(var j = 0; j < tiles.count.x; j++){
                    tiles[i][j].draw();
                }
            }
        };
        
        //------------------------------------------------
        // Zooming Animation（experimental）
        tiles.zoomAnim = function(cursor, on_complete){
            var l, t, w, h;
            for(var i = 0; i < tiles.count.y; i++){
                for(var j = 0; j < tiles.count.x; j++){
                    l = tiles[i][j].canvas.offset().left * 2;
                    t = tiles[i][j].canvas.offset().top * 2;
                    w = tiles[i][j].canvas.width() * 2;
                    h = tiles[i][j].canvas.height() * 2;
                    
                    tiles[i][j].canvas.animate({
                        left : l,
                        top : t,
                        width : w,
                        height : h,
                    },{
                        duration : 1000,
                        easing: "swing",
                        complete: on_complete,
                    });
                }
            }
        };
        
        //------------------------------------------------
        //get Tile Position of Cursor Position（using totaldrag value）
        tiles.getTilePos = function(totalDrag, cursor){
            var pos_delta = {  //カーソル位置の差分とトータルドラッグ量からタイルポジションの差分を得る
                x: ((cursor.x - tiles.startCursor.x) - totalDrag.x) / tiles.tileSize.w,
                y: ((cursor.y - tiles.startCursor.y) - totalDrag.y) / tiles.tileSize.h
            }
            return {
                x: tiles.startPos.x + pos_delta.x,
                y: tiles.startPos.y + pos_delta.y
            }
        };
        
        //------------------------------------------------
        //pixel position of backView( = tiles area) 
        tiles.getBkViewPos = function(){
            return {
                x: parseInt(tiles.bkview.css("left"), 10) + tiles.tileSize.w / 2 - tiles.posOffset.x * tiles.tileSize.w,
                y: parseInt(tiles.bkview.css("top"), 10) + tiles.tileSize.h / 2 - tiles.posOffset.y * tiles.tileSize.h
            };
        };
        
        //------------------------------------------------
        tiles.getScrollRangePixel = function(){
            var herfH = tiles.tileSize.h / 2;
            var herfW = tiles.tileSize.w / 2;
            var scrollRange = {
                x: {
                    min: - (tiles.range.x.max * tiles.tileSize.w + herfW) + tiles.viewSize.w,
                    max: - (tiles.range.x.min * tiles.tileSize.w - herfW),
                },
                y: {
                    min: - (tiles.range.y.max * tiles.tileSize.h + herfH) + tiles.viewSize.h,
                    max: - (tiles.range.y.min * tiles.tileSize.h - herfH),
                },
            };
            return scrollRange;
        };
        
        //------------------------------------------------
        //initialize. generate all tiles. cursorPosにtilePosを持ってくる
        tiles.init = function(arg){
            //tile starting position
            tiles.posOffset.x = Math.floor(arg.tilePos.x - (arg.cursorPos.x / tiles.tileSize.w));
            tiles.posOffset.y = Math.floor(arg.tilePos.y - (arg.cursorPos.y / tiles.tileSize.h));
            
            var bk_offset_left = arg.cursorPos.x
                                 - tiles.tileSize.w * (arg.tilePos.x - tiles.posOffset.x)
                                 - tiles.tileSize.w / 2;  //
            var bk_offset_top = arg.cursorPos.y
                                 - tiles.tileSize.h * (arg.tilePos.y - tiles.posOffset.y)
                                 - tiles.tileSize.h / 2;
            
            tiles.startPos = arg.tilePos; //for getPos
            tiles.startCursor = arg.cursorPos; //for getPos
            //console.log("cursor_position_x" + arg.cursorPos.x + "_y" + arg.cursorPos.y);
            
            //generate 2-dimentional tiles matrix
            for(var i = 0; i < tiles.count.y; i++){
                if(!(tiles[i])){
                    tiles[i] = [];
                }
                for(var j = 0; j < tiles.count.x; j++){
                    tiles[i][j] = makeTile({x : tiles.posOffset.x + j, y : tiles.posOffset.y + i});
                }
            }
            tiles.bkview
                .css("left", bk_offset_left)
                .css("top", bk_offset_top);
                
            //console.log(bk_offset_left, bk_offset_top);
        };
        
        //------------------------------------------------
        //
        tiles.setAttr = function(attr){
            tiles = $.extend(true, tiles, attr);
            tiles.draw();
        };
        
        //------------------------------------------------
        tiles.count = { //background tile count
            x : Math.ceil(arg.viewSize.w / arg.tileSize.w) + arg.preload * 2,
            y : Math.ceil(arg.viewSize.h / arg.tileSize.h) + arg.preload * 2
        };
        tiles.viewSize = arg.viewSize;
        tiles.tileSize = arg.tileSize;
        tiles.bkview = arg.bkview;
        tiles.preload = arg.preload;
        tiles.range = arg.range;
        tiles.drawFunc = arg.drawFunc;
        tiles.zoomInFunc = arg.zoomInFunc;
        tiles.zoomOutFunc = arg.zoomOutFunc;
        tiles.posOffset = {x:0, y:0};  //同じ方向にスクロールしすぎてbkviewのleft/top値が大きくなりすぎるとバグる。対策としてずらすためのオフセット
        
        return tiles;
    };
    
    
    
    
    
    //------------------------------------------------
    // FlexZoomer Object
    //------------------------------------------------
    var fz = {};
    
    //------------------------------------------------
    // http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
    var randomString = function(length){
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    };
    
    //------------------------------------------------
    var init = function(){
        fz.id = randomString(32);
        
        //--------------------------------
        //back ground
        fz.bkground = $("<div/>").appendTo(fz.view)
            .attr("id", "bkground" + fz.id)
            .addClass("flexzoomer-back-ground")
            .css("width", fz.view_w)
            .css("height", fz.view_h);
        
        //--------------------------------
        //view area (visible area of back view)
        fz.view = $("<div/>").appendTo($("#" + fz.containerId))
            .attr("id", "viewport" + fz.id)
            .addClass("flexzoomer-viewport")
            .css("width", fz.view_w)
            .css("height", fz.view_h);
            
        //--------------------------------
        //back view (tiles added to this)
        fz.bkview = $("<div/>").appendTo(fz.view)
            .attr("id", "bkview" + fz.id)
            .addClass("flexzoomer-backview");
            
        //--------------------------------
        // front ground
        fz.ftground = $("<div/>").appendTo(fz.view)
            .attr("id", "ftground" + fz.id)
            .addClass("flexzoomer-frontground")
            .css("width", fz.view_w)
            .css("height", fz.view_h);
        
        //------------------------------------------------
        //scroll
        fz.scroll = function(delta){
            //restrict scroll direction 
            if(fz.scrollable == "both"){
                //nothing to do
            }else if(fz.scrollable == "horizontal"){
                delta.y = 0;
            }else if(fz.scrollable == "vertical"){
                delta.x = 0;
            }else if(fz.scrollable == "none"){
                delta.x = 0;
                delta.y = 0;
            }
            
            // restrict area
            var tiles = fz.levelTiles[fz.currentLevel];
            var scrollRange = tiles.getScrollRangePixel();
            var bkViewPos = tiles.getBkViewPos();
            var newBkPos = {
                x: bkViewPos.x + delta.x,
                y: bkViewPos.y + delta.y,
            }
            
            if(newBkPos.x < scrollRange.x.min){
                delta.x = scrollRange.x.min - bkViewPos.x;
            }else if(scrollRange.x.max < newBkPos.x){
                delta.x = scrollRange.x.max - bkViewPos.x;
            }
            if(newBkPos.y < scrollRange.y.min){
                delta.y = scrollRange.y.min - bkViewPos.y;
            }else if(scrollRange.y.max < newBkPos.y){
                delta.y = scrollRange.y.max - bkViewPos.y;
            }
                
            //scrolling
            fz.totalDrag.x += delta.x;
            fz.totalDrag.y += delta.y;
            
            fz.bkview
                .css("left", "+=" + delta.x)
                .css("top", "+=" + delta.y);
            
            //update tiles
            fz.levelTiles[fz.currentLevel].update();
        };
        
        //------------------------------------------------
        //drag
        // http://stackoverflow.com/questions/1685326/responding-to-the-onmousemove-event-outside-of-the-browser-window-in-ie
        fz.view.mousedown(function(e){
            // save current pos
            fz.preCursorPos = { //cursor position on View
                x: e.pageX - fz.view.offset().left,
                y: e.pageY - fz.view.offset().top,
            };
            
            // 
            document.onmousemove = function(e){
                var cursorPos = { //cursor position on View
                    x: e.pageX - fz.view.offset().left,
                    y: e.pageY - fz.view.offset().top,
                };
                var delta = { //drag distance
                    x : cursorPos.x - fz.preCursorPos.x,
                    y : cursorPos.y - fz.preCursorPos.y
                };
                
                fz.scroll(delta);
                
                //synchro scroll
                for(var i = 0; i < fz.synchro.length; i++){
                    fz.synchro[i].scroll(delta);
                }
                
                // update pre-pos
                fz.preCursorPos = cursorPos;
            };
            
            // stop scroll
            document.onmouseup = function(){
                document.onmousemove = null;
                if(fz.view.releaseCapture){fz.view.releaseCapture();} //for IE
            };
            
            if(fz.view.setCapture){fz.view.setCapture();} //for IE
            
            return false;
        });
        
        //------------------------------------------------
        //zoom
        fz.zoom = function(delta, cursorPos){
            var pos;
            var zoomFunc;
            
            //zoom in
            if(0 <= delta){
                for(var i = 0; i < delta; i++){
                    pos = fz.levelTiles[fz.currentLevel].getTilePos(fz.totalDrag, cursorPos);
                    zoomFunc = fz.levelTiles[fz.currentLevel].zoomInFunc;
                    
                    fz.currentLevel++;
                    if(fz.maxLevel < fz.currentLevel){
                        fz.currentLevel = fz.maxLevel;
                        break;
                    }else{
                        //fz.levelTiles[fz.currentLevel - 1].zoomInAnim();
                        fz.levelTiles[fz.currentLevel - 1].removeAll();
                        fz.levelTiles[fz.currentLevel].init({
                            tilePos : zoomFunc(pos),
                            cursorPos : cursorPos
                        });
                        fz.draw();
                        fz.totalDrag = {x: 0, y:0};
                    }
                }
            //zoom out
            }else{
                for(var i = 0; i > delta; i--){
                    pos = fz.levelTiles[fz.currentLevel].getTilePos(fz.totalDrag, cursorPos);
                    zoomFunc = fz.levelTiles[fz.currentLevel].zoomOutFunc;
                    
                    fz.currentLevel--;
                    if(fz.currentLevel < 0){
                        fz.currentLevel = 0;
                        break;
                    }
                    
                    fz.levelTiles[fz.currentLevel + 1].removeAll();
                    fz.levelTiles[fz.currentLevel].init({
                        tilePos : zoomFunc(pos),
                        cursorPos : cursorPos
                    });
                    fz.draw();
                    fz.totalDrag = {x: 0, y:0};
                    
                    fz.scroll({x:0, y:0});
                }
            }
        };
        
        //------------------------------------------------
        //wheel
        fz.view.mousewheel(function(e, delta){
            var cursorPos = {
                x : e.pageX - fz.view.offset().left,
                y : e.pageY - fz.view.offset().top
            }
            
            fz.zoom(delta, cursorPos);
            
            //synchro zoom
            for(var i = 0; i < fz.synchro.length; i++){
                fz.synchro[i].zoom(delta, cursorPos);
            }
            
            return false;
        });
    };
    
    //------------------------------------------------
    // interface
    //------------------------------------------------
    // Viewエリアに表示するズームレベルと位置の設定
    fz.position = function(level, tilePos, align){
        fz.currentLevel = level;
        
        tilePos = tilePos || {x: 0, y: 0};
        align = align || "center";
        var cursorPos = {x: fz.view_w / 2, y: fz.view_h / 2};
        var tileSize = fz.levelTiles[level].tileSize;
        
        if(align.match(/left/)){
            cursorPos.x = tileSize.w / 2;
        }else if(align.match(/right/)){
            cursorPos.x = fz.view_w - tileSize.w / 2;
        }
        if(align.match(/top/)){
            cursorPos.y = tileSize.h / 2;
        }else if(align.match(/bottom/)){
            cursorPos.y = fz.view_h - tileSize.h / 2;
        }
        
        fz.levelTiles[level].init({
            tilePos: tilePos,
            cursorPos: cursorPos,
        });
        fz.scroll({x:0, y:0});
        fz.draw();
    };
    
    //------------------------------------------------
    // Set a zoom level attr
    fz.zoomLevel = function(level, attrs){ //arguments: level, tileSize, preload, range, drawFunc, zoomInFunc, zoomOutFunc
        var defaults = {
            viewSize: {w: fz.view_w, h: fz.view_h},
            tileSize: {w: 50 * (level+1), h: 50 * (level+1)}, //size of a tile タイル1個のサイズ
            bkview: fz.bkview,
            preload: 1, //preload tile count for scroll 先読みタイル数
            range : {x: {min: -10, max: 10}, y: {min: -10, max: 10}}, //scroll range of tile position
            drawFunc: null, //draw tile function
            zoomInFunc: function(pos){ //position mapping function in increase zoom level タイルレベルを+1する時の位置変換関数
                return {x : pos.x, y : pos.y};
            },
            zoomOutFunc: function(pos){ //position mapping function in decrease zoom level タイルレベルを-1する時の位置変換関数
                return {x : pos.x, y : pos.y};
            },
        };
        
        fz.levelTiles[level] = new Vtmx( $.extend(true, defaults, attrs))
        fz.maxLevel = fz.levelTiles.length - 1;
    };
    
    //------------------------------------------------
    // Set attribute of layer
    fz.setAttr = function(level, attrs){
        fz.levelTiles[level].setAttr(attrs);
        fz.scroll({x:0, y:0});
    };
    
    //------------------------------------------------
    // Set each zoom level attributes
    fz.zoomLevels = function(zoomLevels){
        var len = zoomLevels.length;
        for(var level = 0; level < len; level++){
            var def = zoomLevels[level];
            
            if(level == 0){
                def.zoomOutFunc = null;
            }else if(level == (len-1)){
                def.zoomInFunc = null;
            }
            
            fz.zoomLevel(level, def);
        }
    };
    
    //------------------------------------------------
    //現在表示中のタイル(はみ出し分含む)のポジションの範囲を返す
    //2014.03.25 なんか値がおかしい
    fz.getTilePosRange = function(){
        var tiles = fz.levelTiles[fz.currentLevel];
        var leftTopTile = tiles[0][0];
        var rightBottomTile = tiles[tiles.length - 1][tiles[tiles.length - 1].length - 1];
        var pld = tiles.preload;
        
        return {
            x: {min: leftTopTile.pos.x + pld, max: rightBottomTile.pos.x - pld},
            y: {min: leftTopTile.pos.y + pld, max: rightBottomTile.pos.y - pld}
        };
    };
    
    //------------------------------------------------
    // count of zoom-level
    fz.levelCount = function(){
        return fz.levelTiles.length;
    };
    
    //------------------------------------------------
    // Draw current zoom-level tiles
    fz.draw = function(){
        fz.levelTiles[fz.currentLevel].draw();
    };
    
    //------------------------------------------------
    // Add to synchronize list. synchronize zooming and scrollings.
    fz.synchronize = function(otherFlexZoomer){
        fz.synchro.push(otherFlexZoomer);
        otherFlexZoomer.synchro.push(fz);
    };
    
    //------------------------------------------------
    fz = $.extend(true, fz, {
        levelTiles: [], //tile info of each level
        maxLevel: 0,
        currentLevel: 0,
        scrollable: "both", //"both", "horizontal", "vertical", "fix"
        synchro: [],
        // other
        totalDrag : {x:0, y:0},  //レベルごとにリセットするドラッグ量
        parallax_rate : 0,  // "scroll distance of tile"  x  "parallax_rate" = scroll distance of background
        totalDrag_endless : {x:0, y:0}  //ずっと貯めこんでいくドラッグ量(for background scroll)
    });
    fz = $.extend(true, fz, attrs);
    fz.view_w = $("#" + fz.containerId).width(); //pixel
    fz.view_h = $("#" + fz.containerId).height(); //pixel
    
    init();
    return fz;
};
