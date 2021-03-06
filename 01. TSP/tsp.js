

var canvasHelper = function (c) {
    var canvas = c;
    var context = canvas.getContext('2d');
    var cities = [];

    return {
        drawCities: function (p) {
            cities = p;
            context.fillStyle = '#000000';
            for (var i = 0; i < cities.length; i++) {
                context.fillRect(cities[i].x, cities[i].y, 5, 5);
            }
        },
        clean: function () {
            context.fillStyle = '#CCCCCC';
            context.fillRect(0, 0, canvas.width, canvas.height);
            cities = [];
        },
        drawLine: function (line) {
            if (line.length > cities.length) {
                console.error('line is too long, cities: ' + cities.length);
                return;
            }

            context.beginPath();
            var firstPoint = cities[line[0]];
            context.moveTo(firstPoint.x, firstPoint.y);
            for (var z = 1; z < line.length; z++) {
                context.lineTo(cities[line[z]].x, cities[line[z]].y);
            }

            context.lineTo(cities[line[0]].x, cities[line[0]].y);

            context.strokeStyle = line.color;
            context.stroke();
        }
    };
};

var salesmansHelper = function (canvas, bestCanvas) {
    var countOfSalesmans;   //amount of different paths to use
    var cities = [];        //city locations X, Y
    var salesmans = [];     //each salesmans element is array of cities
    var maxDist = 0;        //longest distance between any two cities, used for punishment   
    var timer;              //automate algorithm execution
    var evolution = 0;      //algorithm step

    var drawingBoard = canvasHelper(c); //used to draw all paths
    var bestDrawingBoard = canvasHelper(bestCanvas); //used to draw current best path

    //get mouse position inside canvas, to add c 
    var getMousePos = function (canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left - (e.clientX - rect.left) % 5,
            y: e.clientY - rect.top - (e.clientY - rect.top) % 5
        };
    };

    //add mouse click listener to main canvas
    canvas.addEventListener('mousedown', function (e) {
        //canvas element is disabled when algorithm is running
        // or when algorithm was running and then paused, should clean and then add more cities
        if (canvas.disabled
            || (cities.length > 0 && evolution != 0)) {
            return;
        }

        var pos = getMousePos(this, e);

        //dont add same point twice
        for (var i = 0; i < cities.length; i++) {
            if (cities[i].x == pos.x && cities[i].y == pos.y) {
                return;
            }
        }

        cities.push(pos);
        drawingBoard.drawCities(cities);
    });

    //random city selector
    var randomCity = function () {
        return random(cities.length);
    };

    var random = function (max) {
        return Math.floor(Math.random() * max);
    };

    //each salesmans gets random color before algorithm start
    var getRandomColor = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    var getDistance = function (a, b) {
        return Math.sqrt(Math.pow(cities[a].x - cities[b].x, 2) + Math.pow(cities[a].y - cities[b].y, 2));
    };

    //max distance between any two points, used as punishment
    var maxDistance = function () {
        var max = 0;
        for (var i = 0; i < cities.length; i++) {
            for (var a = 0; a < cities.length; a++) {
                max = Math.max(getDistance(i, a), max);
            }
        }
        return max;
    };

    var getTotalDistance = function (salesman) {
        var dist = 0;
        for (var i = 0; i < salesman.length - 1; i++) {
            dist += getDistance(salesman[i], salesman[i + 1]);
        }

        if (salesman.length > 2) {
            dist += getDistance(salesman[0], salesman[cities.length - 1]);
        }

        return dist;
    };

    var hasDuplicates = function (salesman) {
        var citiesInPath = [];
        for (var i = 0; i < salesman.length; i++) {
            if (citiesInPath[salesman[i]]) {
                return true
            }
            citiesInPath[salesman[i]] = true;
        }
        return false;
    };

    var getFitness = function (salesman) {
        //penalty for cheating, when same city is visited more than once
        var penalty = hasDuplicates(salesman) * cities.length * maxDist;
        var distance = getTotalDistance(salesman);
        return Math.round(distance + penalty);
    };

    var minFitness = function () {
        var min = 999999999999;
        for (var a = 0; a < salesmans.length; a++) {
            min = Math.min(salesmans[a].fitness, min);
        }
        return min;
    };

    //lower fitness = shorter path
    var bestSalesmanId = function () {
        var best = 999999999999;
        var bestId = 0;
        for (var a = 0; a < salesmans.length; a++) {
            if (salesmans[a].fitness < best) {
                best = salesmans[a].fitness;
                bestId = a;
            }
        }
        return bestId;
    };

    var maxFitness = function () {
        var max = 0;
        for (var a = 0; a < salesmans.length; a++) {
            max = Math.max(salesmans[a].fitness, max);
        }
        return max;
    };

    var avgFitness = function () {
        var sum = 0;
        for (var a = 0; a < salesmans.length; a++) {
            sum += salesmans[a].fitness;
        }
        return Math.round(sum / salesmans.length);
    };

    //helper functions to output information
    var printResults = function () {
        var table = document.createElement('TABLE');
        var tableDiv = document.getElementById('results');
        tableDiv.innerText = '';
        var tableBody = document.createElement('TBODY')

        table.border = '1'
        table.appendChild(tableBody);

        var heading = new Array();
        heading[0] = 'Salesman'
        heading[1] = 'Path'
        heading[2] = 'Distance'

        //TABLE COLUMNS
        var tr = document.createElement('TR');
        tableBody.appendChild(tr);
        for (i = 0; i < heading.length; i++) {
            var th = document.createElement('TH')
            th.width = '75';
            th.appendChild(document.createTextNode(heading[i]));
            tr.appendChild(th);
        }

        //TABLE ROWS
        for (i = 0; i < salesmans.length; i++) {
            var tr = document.createElement('TR');
            var td1 = document.createElement('TD');
            td1.appendChild(document.createTextNode(salesmans[i].index));
            tr.appendChild(td1);

            var td2 = document.createElement('TD');
            td2.appendChild(document.createTextNode(salesmans[i].join(',')));
            tr.appendChild(td2);

            var td3 = document.createElement('TD');
            td3.appendChild(document.createTextNode(salesmans[i].fitness));
            tr.appendChild(td3);

            tableBody.appendChild(tr);
        }

        tableDiv.appendChild(document.createTextNode('Max distance: ' + maxFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Min distance: ' + minFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Avg distance: ' + avgFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Evolution: ' + evolution));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('City count: ' + cities.length));

        tableDiv.appendChild(table);
    };

    var disableInputFields = function (disable) {
        document.getElementById('tspCanvas').disabled = disable;
        document.getElementById('countOfSalesmans').disabled = disable;
        document.getElementById('cleanBtn').disabled = disable;
        document.getElementById('startBtn').disabled = disable;
        document.getElementById('stepBtn').disabled = disable;
        document.getElementById('stopBtn').disabled = !disable;
    }
    //---------------------------------------

    //create random path using all cities only once
    var uniquePath = function () {
        var p = [];
        var path = [];

        for (var j = 0; j < cities.length; j++) {
            p.push(j);
        }

        while (p.length > 0) {
            var element = random(p.length);
            path.push(p[element]);
            p.splice(element, 1);
        }

        return path
    };

    var initialize = function () {
        for (var i = 0; i < countOfSalesmans; i++) {
            var particle = [];

            //get random path, which goes only once to each city
            particle = uniquePath();
            //random color for display
            particle.color = getRandomColor();
            //calculate fitness, path between first first city to last
            particle.fitness = getFitness(particle);

            particle.index = i;

            salesmans.push(particle);
            drawingBoard.drawLine(particle);
        }
        maxDist = maxDistance();
    };

    var indexOf = function (element, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === element) {
                return i;
            }
        }
        return null;
    }

    //take random cities from fittest to others
    var crossOver = function () {
        var bestId = bestSalesmanId();
        var amountToCross = Math.floor(cities.length * 0.2);
        for (var i = 0; i < salesmans.length; i++) {
            for (var a = 0; a < amountToCross; a++) {
                var toCross = randomCity();
                var from = indexOf(salesmans[bestId][toCross], salesmans[i]);

                if (from == null) {
                    continue;
                }

                var tempIndex = from;
                var tempValue = salesmans[i][from];

                salesmans[i][from] = salesmans[i][toCross];
                salesmans[i][toCross] = tempValue;
            }
        }
    };

    //swap cities, exclude fittest
    var mutate = function () {
        var bestId = bestSalesmanId();
        for (var i = 0; i < salesmans.length; i++) {
            var extraMutationForExtraBad = Math.floor(salesmans[i].fitness / salesmans[bestId].fitness > 1.49 ? (salesmans[i].fitness / salesmans[bestId].fitness - 1.2) : 0) * 10;

            var amountToMutate = Math.floor(cities.length * ((random(3) + extraMutationForExtraBad) * 0.1));
            var doMutation = random(2);

            if (bestId != i && doMutation == 1) {
                for (var a = 0; a < amountToMutate; a++) {
                    var from = randomCity();
                    var to = randomCity();
                    var temp = salesmans[i][to];
                    salesmans[i][to] = salesmans[i][from];
                    salesmans[i][from] = temp;
                }
            }
        }
    };

    //calculate fitness for all salesmans elements and update canvas
    var calculateFitness = function () {
        for (var i = 0; i < countOfSalesmans; i++) {
            salesmans[i].fitness = getFitness(salesmans[i]);
            drawingBoard.drawLine(salesmans[i]);
        }

        salesmans.sort(function (a, b) { return a.fitness - b.fitness; });
        bestDrawingBoard.drawLine(salesmans[0]);
    };

    var initializeOnFirstStep = function () {
        if (evolution == 0) {
            countOfSalesmans = parseInt(document.getElementById('countOfSalesmans').value);
            salesmans = [];
            initialize();
            drawCities();
            printResults();
        }
    };

    var stepByOne = function () {
        crossOver();
        mutate();

        cleanCanvas();
        drawCities();

        calculateFitness();
        printResults();
        evolution++;
    };

    //helper functions to sinchronize canvas operations
    var drawCities = function () {
        bestDrawingBoard.drawCities(cities);
        drawingBoard.drawCities(cities);
    };

    var cleanCanvas = function () {
        bestDrawingBoard.clean();
        drawingBoard.clean();
    };

    var drawSwarms = function () {
        bestDrawingBoard.clean();
        drawingBoard.clean();
    };
    //---------------------------------------

    return {
        start: function () {
            initializeOnFirstStep();
            disableInputFields(true);
            timer = setInterval(function () {
                stepByOne();
            }, 50);
        },
        step: function () {
            initializeOnFirstStep();
            stepByOne();
        },
        stop: function () {
            clearInterval(timer);
            disableInputFields(false);
        },
        clean: function () {
            clearInterval(timer);
            cleanCanvas();
            cities = [];
            salesmans = [];
            disableInputFields(false);
            evolution = 0;
        }
    }
};

var c = document.getElementById('tspCanvas');
var bestSolution = document.getElementById('bestSolutionCanvas');
var salesmans = salesmansHelper(c, bestSolution);
salesmans.clean();