/*
    Sokoban Game
    by
    Stefan Sundbeck
*/

/*
    Main code:
*/
var playerPositionX = 0;
var playerPositionY = 0;
var numBlocksRemaining = 0;
var numberOfMovesUsed = 0;
var timeElapsed = 0;
var startTime = 0;
var intervalTimer = 0;
var mapCompleted = false;
var timeElapsedCounterStarted = false;

var mapGridRules = [];                                      // Will contain where the walls & the goal area is

var currentTileMap = tileMap01;

// Build the mapGridRules array from the tile map:
for (var y = 0; y < currentTileMap.height; y++) 
{
    let row = [];
    for (let x = 0; x < currentTileMap.width; x++) 
    {
        var element = currentTileMap.mapGrid[y][x][0];

        if (element == "P")                                 // Player starting position found.. register it
        {
            playerPositionX = x;
            playerPositionY = y;
            console.log(`playerPositionX: ${x+1} playerPositionY: ${y+1}`);
        }

        switch (element) 
        {
            case "W":
                mapTileClass = Tiles['Wall'];    
                break;
            case "G":
                mapTileClass = Tiles['Goal'];    
                numBlocksRemaining++;
                break;
            default:
                mapTileClass = Tiles['Space'];
                element = " ";
                break;
        }

        let mapGridTile = { className: mapTileClass, cellType: element};

        row.push(mapGridTile);
    }
    mapGridRules.push(row);
}

DrawMap(currentTileMap,"Map");
UpdateBlocksRemaining();
UpdateNumberOfMovesUsed();

// Listen to key presses:
document.addEventListener('keydown', KeyPressed);

// Stop the browser from scrolling the page when the arrow keys are pressed:
window.addEventListener("keydown", ArrowKeysDisabler);

// Respond to window resizes (for MapCompletedAlertBox)
window.addEventListener("resize", WindowResized);


/*
    Functions:
*/

function StartTimeElapsedCounter()
{
    var date = new Date();
    startTime = date.getTime();
    console.log(startTime);
    
    // Start the Time Elapsed counter
    intervalTimer = setInterval(UpdateTimeElapsed,1000);
}

function MakeMapGridTileIDString(x, y)
{
    return  `MapGridTile_X${x + 1}Y${y + 1}`;
}

function GetMapCellClassFromMapGridElement(mapGridElement)
{
    switch (mapGridElement) 
    {
        case " ":
        default:
            mapcellClass = Tiles['Space'];
            break;
        case "W":
            mapcellClass = Tiles['Wall'];
            break;
        case "B":
            mapcellClass = Entities['Block'];;
            break;
        case "G":
            mapcellClass = Tiles['Goal'];
            break;
        case "P":
            mapcellClass = Entities['Character'];
            break;
                            
    }

    return mapcellClass;
}

function DrawMap(tileMap, id)
{
    var mapElement = document.getElementById(id);

    for (let y = 0; y < tileMap.height; y++) 
    {
        let mapRow = document.createElement('div');
        mapRow.className = "MapRow";

        for (let x = 0; x < tileMap.width; x++) 
        {
            var element = tileMap.mapGrid[y][x][0];
            
            mapcellClass = GetMapCellClassFromMapGridElement(element);

            let mapcell = document.createElement('div');
            mapcell.id=MakeMapGridTileIDString(x,y);
            mapcell.className = `MapGridTile ${mapcellClass}`;

            mapRow.appendChild(mapcell);
        }
        mapElement.appendChild(mapRow);
    }
}

function movePlayer(changeX, changeY)
{
    if (mapCompleted) 
    {
        return;
    }

    // Limit movement to 1 tile
    if (changeX > 1) 
        changeX = 1;
    else
    if (changeX < -1)
        changeX = -1;

    if (changeY > 1) 
        changeY = 1;
    else
    if (changeY < -1)
        changeY = -1;

    var newPlayerPositionY = playerPositionY + changeY;
    var newPlayerPositionX = playerPositionX + changeX;

    if (newPlayerPositionY < 0 ) 
        newPlayerPositionY = 0;    
    else
    if (newPlayerPositionY >= currentTileMap.height)
        newPlayerPositionY = currentTileMap.height - 1;

    if (newPlayerPositionX < 0 ) 
        newPlayerPositionX = 0;    
    else
    if (newPlayerPositionX >= currentTileMap.width)
        newPlayerPositionX = currentTileMap.width - 1;

    var newCellType = currentTileMap.mapGrid[newPlayerPositionY][newPlayerPositionX][0];
    var GridRulesNewCellType = mapGridRules[newPlayerPositionY][newPlayerPositionX].cellType;
    var moveThePlayer = false;

    if (newCellType != "W")                                                                         // If the tile next to the player isn't a wall tile the player may be movable
    {
        if (newCellType == "B")                                                                     // The tile next to the player contains a movable block.. Check if it also is movable 
        {
            var newBlockPositionX = newPlayerPositionX + changeX;
            var newBlockPositionY = newPlayerPositionY + changeY;

            var cellBeyondBlock = currentTileMap.mapGrid[newBlockPositionY][newBlockPositionX][0];

            if (cellBeyondBlock != "W" && cellBeyondBlock!= "B")                                    // The tile next to the block can't be a wall- or another block tile
            {                                                                                       // block is movable..
                // Move the block to the new position on the map:
                var mapTile = document.getElementById(MakeMapGridTileIDString(newBlockPositionX, newBlockPositionY));
                mapTile.className = "MapGridTile ";

                // Update the map grid:
                currentTileMap.mapGrid[newBlockPositionY][newBlockPositionX][0] = "B";

                if (cellBeyondBlock == "G")                                                         // Player moved a block into the goal area or within it
                {
                    mapTile.className+=Entities['BlockDone'];
                    if (GridRulesNewCellType != "G")                                                // Only register this as a completed block if the player moves a block into the goal area
                    {                                                                               // not when moving the block around in the goal area
                        numBlocksRemaining--;
                        UpdateBlocksRemaining();                                                    // Update the Player Stats Panel on the webpage
                        console.log(`numBlocksRemaining = ${numBlocksRemaining}`);

                        if (numBlocksRemaining == 0)                                                // Player completed the map..
                        {
                            UpdateTimeElapsed();
                            
                            mapCompleted = true;
                        }
                    }
                } else
                    mapTile.className+=Entities['Block'];

                if (GridRulesNewCellType == "G" && cellBeyondBlock != "G") 
                {                                                                                   // Player moved a movable block out of the goal area..
                    numBlocksRemaining++;
                    UpdateBlocksRemaining();                                                        // Update the Player Stats Panel on the webpage
                    console.log(`numBlocksRemaining = ${numBlocksRemaining}`);
                }
                moveThePlayer = true;
            }
        } else
            moveThePlayer = true;
    }

    if (moveThePlayer)
    {
        // Move the player to the new position on the map:
        var mapGridTile = document.getElementById(MakeMapGridTileIDString(newPlayerPositionX, newPlayerPositionY));
        mapGridTile.className = `MapGridTile ${Entities['Character']}`;

        // Remove the player from the old position on the map:
        mapGridTile = document.getElementById(MakeMapGridTileIDString(playerPositionX, playerPositionY));
        var mapGridTileRules = mapGridRules[playerPositionY][playerPositionX];

        mapGridTile.className = `MapGridTile ${mapGridTileRules.className}`;

        // Update the map grid:
        currentTileMap.mapGrid[newPlayerPositionY][newPlayerPositionX][0] = "P";
        currentTileMap.mapGrid[playerPositionY][playerPositionX][0] = mapGridTileRules.cellType;         // Restore the map-grid tile where the player were

        playerPositionY = newPlayerPositionY;
        playerPositionX = newPlayerPositionX;

        numberOfMovesUsed++;
        UpdateNumberOfMovesUsed();                                                                      // Update the Player Stats Panel on the webpage

        if (timeElapsedCounterStarted == false) 
        {
            StartTimeElapsedCounter();
            timeElapsedCounterStarted = true;
        }

        if (mapCompleted) 
        {
            clearInterval(intervalTimer);                                                               // Stop the Time Elapsed counter
            ShowMapCompletedAlertBox();
        }
    }
}

function ArrowKeysDisabler(event)
{
    switch(event.code)
    {
        case "ArrowUp": 
        case "ArrowDown": 
        case "ArrowLeft": 
        case "ArrowRight":
        case "Space":
             event.preventDefault();    // Block the arrow keys 
             break;
        default: 
            break;                      // do not block other keys
    }
}

function KeyPressed(event)
{
    switch (event.code) 
    {
        case "ArrowUp": 
        case "KeyW":
            movePlayer(0,-1);
            break;
        case "ArrowDown": 
        case "KeyS":
            movePlayer(0,1);
            break;
        case "ArrowLeft": 
        case "KeyA":
            movePlayer(-1,0);
            break;
        case "ArrowRight": 
        case "KeyD":
            movePlayer(1,0);
            break;
    
        default:
            break;
    }
//    console.log(event);
};

function UpdateBlocksRemaining()
{
    document.getElementById("BlocksRemaining").innerHTML = `Crates remaining: ${numBlocksRemaining}`;
}

function UpdateNumberOfMovesUsed()
{
    document.getElementById("NumberOfMovesUsed").innerHTML = `Moves: ${numberOfMovesUsed}`;
}

function UpdateTimeElapsed()
{
    var date = new Date();
    timeElapsed = date.getTime() - startTime;

    date.setTime(timeElapsed);
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    var timeElapsedString = `Time elapsed: ${minutes}m ${seconds}s`;

    document.getElementById("TimeElapsed").innerHTML = timeElapsedString;
    return timeElapsedString;
}

function WindowResized()
{
    var mapCompletedAlertBox = document.getElementById("MapCompletedAlertBox");

    if (mapCompletedAlertBox.style.visibility === "visible") 
    {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var boxWidth = parseFloat(mapCompletedAlertBox.style.width) + 7*2 + 8*2;        // Add width for border and padding
        var boxHeight = parseFloat(mapCompletedAlertBox.style.height) + 7*2 + 5*2;      // Add height for border and padding
        var left = width / 2 - boxWidth / 2;
        var top = height / 2 - boxHeight / 2;

        mapCompletedAlertBox.style.left = `${left}px`;
        mapCompletedAlertBox.style.top = `${top}px`;
    }
}

function ShowMapCompletedAlertBox()
{
    var mapCompletedAlertBox = document.getElementById("MapCompletedAlertBox");
    mapCompletedAlertBox.style.width = "600px";
    mapCompletedAlertBox.style.height = "265px";

    document.getElementById("MapCompletedAlertBox_TimeUsed").innerHTML =  UpdateTimeElapsed();
    document.getElementById("MapCompletedAlertBox_NumberOfMovesUsed").innerHTML =  `Number of moves used: ${numberOfMovesUsed}`;

    mapCompletedAlertBox.style.visibility = 'visible';              // Unhide it

    WindowResized();                                                // Position it on the screen
}

function MapCompletedAlertBox_OKButtonClick()
{
    var mapCompletedAlertBox = document.getElementById("MapCompletedAlertBox");
    mapCompletedAlertBox.style.visibility = 'hidden';               // Hide it

}