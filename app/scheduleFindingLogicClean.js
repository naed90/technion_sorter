/**
 * New node file
 */

'use strict';



var doSomething = (function () {
    "use strict";
    var coursesToRead2 = {};
    return {
        //test: (operateOnCoursesToRead),
        test2: (function () {
            return console.log("Reading " + JSON.stringify(coursesToRead2));
        }),
        getCoursesToRead : (function () {
            return coursesToRead2;
        }),
        setCoursesToRead : function(courses)
        {
            coursesToRead2 = courses;
        },

        executeMatching: (function()
        {
            operateOnCoursesToRead(coursesToRead2);
        })
    };
}());

var coursesToRead;
var course_num_length = 6;

function operateOnCoursesToRead(courses)
{
    coursesToRead = courses;
    var checkAvCourses = [];
    for(var course_num in coursesToRead)
    {
        var course = coursesToRead[course_num];
        if(!course.slots){//if slots are given it means course was hand-coded, e.g. like the modular physics one
            if(course.checkAv)
            {
                if(course.currentSlot)
                    course_num = {course:course_num, slot: course.currentSlot};//parser can take care of understanding this
                checkAvCourses.push(course_num);
            }
            else
                readCourse(course_num, connectToCoursesToRead);}
    }

    if(checkAvCourses.length)
    {
        readCourse(checkAvCourses, connectToCoursesToRead, true);
    }
    executeOnFullCourses();//must call in case all courses had their slots already inputted and thus the reader was never called
}

function connectToCoursesToRead(course_num, slots)
{
    var course = coursesToRead[course_num];
    if(course)
    {
        course.slots = slots;
        executeOnFullCourses();
    }
}


var alreadyExecuted = false;//async funtions can return at different times and cause executeOnFullCourses to run multiple times.

function executeOnFullCourses()
{
    if(alreadyExecuted)return;
    if(!validateCoursesToRead())return;




    var args = [];

    for(var course_num in coursesToRead)

    {
        args.push(coursesToRead[course_num]);
    }

    if(alreadyExecuted)return;//check twice to make sure no one changed this in the meantime. (kind of fake sync locks)
    alreadyExecuted = true;
    run (args);

}

function validateCoursesToRead()
{

    for(var course_num in coursesToRead)
    {
        var course = coursesToRead[course_num];
        if(!requires(course, ["name", "number", "slots"]))
            return false;
    }
    return true;
}

function requires(postdata, listOfStrings) {
    for (index = 0; index < listOfStrings.length; index++) {
        stringToCheck = listOfStrings[index];
        if (!postdata.hasOwnProperty(stringToCheck))// so that we can take
        // things like "0" or
        // "false"
        {
            return false;
        }
    }
    return true;
}


/*
 *
 * var introToCS = {
 slots :
 reader.readCourse("introCS_html"),
 name : "introCS",
 number : "234114"
 };

 var combinatorics = {
 slots :
 reader.readCourse("combo_html"),
 name : "combinatorics",
 number : "234141"
 };
 * var infi = {
 slots :
 reader.readCourse("infi_html"),
 name : "Infi_1",
 number : "104195"
 };

 var num_sys = {
 slots :
 reader.readCourse("numsys_html"),
 name : "Number_Systems",
 number : "234145"
 };
 var phys = {
 slots :
 reader.readCourse("physics1_html"),
 name : "Physics 1",
 number : "114071"
 };

 var integrals = {
 slots :
 reader.readCourse("integrals_html"),
 name : "Integral_Methods",
 number : "104001"
 };

 var dat_struct = {
 slots :
 reader.readCourse("structs_html"),
 name : "Data_Structures",
 number : "234218"
 };

 */

//run([alg_a, introToCS, combinatorics, infi, num_sys, dat_struct, phys, integrals, mod_phys])
//console.log(JSON.stringify(integrals))

function run(courses)
{

    var sols;
    for(var i = 0; i < courses.length; i++)
    {
        var course = courses[i];
        sols = fitIntoSolutions(course, sols);
    }

    verifySols(courses, sols);//not really necessary due to algorythm change below. can keep this here cuz it doesn't take too long to run and if a mistake happened somewhere it will make sure it is erased.

    //printSolsByDay(sols);
    var schedules = breakSolsUpIntoDays(sols);

    calcNumUnAveForSchedules(schedules);
    schedules.sort(compareSolutionsByNumUnave)


    reaccessSchedulesIndecies(schedules)
    fitSchedulesIntoParts(schedules);
    printSchedules(schedules);


    initPossibleCourses(schedules);
    //excludePartition(getPart("Sunday", 1))
    //excludePartition(getPart("Tuesday", 1))

    //mergeWithPartition(getPart("Sunday", 1))
    //mergeWithPartition(getPart("Tuesday", 1))

    filterParts(partitioners);//kicks parts which have no more schedules inside possibleCourses

    printParts(partitioners);
    //console.log(JSON.stringify(partitioners));
    console.log(possibleCourses);

    printSchedules(schedules, possibleCourses);


}

function reaccessSchedulesIndecies(schedules)
{
    for(var i = 0; i < schedules.length; i++){
        var s = schedules[i];
        s.s_num = i;
    }
}

function verifySols(courses, sols)
{

    var retval = [];

    adder: for(var i = 0; i < sols.length; i++)
    {
        var sol = sols[i];

        if(sol.length!=courses.length)
        {
            continue adder;
        }

        for(var j = 0; j < courses.length; j++)
        {
            var course = courses[j];
            if(sol[course.number].course!==course)
                continue adder;
        }

        retval.push(sol);
    }


}

function printSols(sols)
{

    for (var i = 0; i < sols.length; i++)
    {
        var solution = sols[i];

        var num_unave = getNumberOfUnAveCourses(solution)
        console.log("Solution #"+(i+1) + (num_unave ? (" (Number of unavailable slots: " + num_unave + " )"):""));
        for(var course_number in solution)
        {
            var course_obj = solution[course_number];
            var course = course_obj.course;
            console.log(course.name + " (" + course.number + ")");
            var slot = course_obj.slot;
            console.log("Slot: " + slot.name + (slot.unavailable?(" (Note: Slot Unavailable) "):0))
            for(var m = 0; m < slot.times.length; m++)
            {
                var time = slot.times[m];
                var day = dayFromTime(time.start)//safe to assume courses start and end on the same day.
                console.log(day + ", " + Math.floor((time.start%10000)/100) + ":" + (time.start%10000)%100 + "-" + Math.floor((time.end%10000)/100) + ":" + (time.end%10000)%100)
            }
            console.log();// new line
        }
        console.log("----------------------");
        console.log()
    }
}

function getNumberOfUnAveCourses(solution)
{

    var counter = 0;
    for(var course_number in solution)
    {
        var course_obj = solution[course_number];
        var slot = course_obj.slot;
        if(slot.unavailable)
        {
            counter++;
        }
    }

    return counter;

}


function printSolsByDay(sols)
{
    for (var i = 0; i < sols.length; i++)
    {
        var solution = sols[i];

        var num_unave = getNumberOfUnAveCourses(solution)
        console.log("Solution #"+(i+1) + (num_unave ? (" (Number of unavailable slots: " + num_unave + " )"):""));
        var dayNum = 1;
        while(dayNum<=7)
        {

            var entriesForThisDay = [];
            console.log("~"+dayFromTime(dayNum*10000)+"~")
            for(var course_number in solution)
            {
                var course_obj = solution[course_number];
                course = course_obj.course;
                //console.log(course.name + " (" + course.number + ")");
                var slot = course_obj.slot;
                //console.log("Slot: " + slot.name)
                for(var m = 0; m < slot.times.length; m++)
                {
                    var time = slot.times[m];
                    if(Math.floor(time.start/10000)==dayNum)
                    {
                        //var day = dayFromTime(time.start)//safe to assume courses start and end on the same day.
                        entriesForThisDay.push({time:time, course:course, slot:slot});
                    }
                }
                //console.log();// new line
            }

            entriesForThisDay.sort(compareEntryTimes)
            for(var v = 0; v < entriesForThisDay.length;v++)
            {
                var entry = entriesForThisDay[v];
                var time = entry.time;
                var course = entry.course;
                var slot = entry.slot;
                console.log(Math.floor((time.start%10000)/100) + ":" + (time.start%10000)%100 + "-" + Math.floor((time.end%10000)/100) + ":" + (time.end%10000)%100 + " --- " + course.name + " (" + course.number + ")" + ", Slot: " + slot.name + (slot.unavailable?(" (Note: Slot Unavailable) "):0))
            }

            console.log("----------------------");
            console.log()

            dayNum++;
        }

    }
}


/*
 * Schedule:
 *
 * contains properties "sunday" thru "saturday" which hold arrays of what classes are that day.
 * properties "sunday_consolidated" thru "saturday_consolidated" are arrays of times outlining the day
 *
 * s_num = unique number for this schedule. used for identifying this schedule. is also the index of the schedule the general schedule array (the one stored in run())
 *
 * solution = original solution obj
 *
 * num_unave = num of unave slots in this schedule
 *
 */

function calcNumUnAveForSchedules(schedules)
{

    for (var i = 0; i < schedules.length; i++)
    {
        var s = schedules[i];
        s.num_unave = getNumberOfUnAveCourses(s.solution);
    }

}

//replacement function for printSolsByDay
//if given possiblechoices, only prints schedules in this array.
function printSchedules(schedules, possibleChoices)
{
    //console.log("Printing schedules")
    console.log(possibleChoices.length)
    var iterator = (possibleChoices && possibleChoices.length) ? makeIterator(possibleChoices):false;
    if(iterator)
        console.log(iterator)
    for (var i = iterator ? iterator.next().value : 0; i < schedules.length && (iterator ? i : true); iterator ? i = iterator.next().value : i++)
    {
        var s = schedules[i];


        var num_unave = s.num_unave;
        console.log("Solution #"+(i+1) + (num_unave ? (" (Number of unavailable slots: " + num_unave + " )"):""));
        var dayNum = 1;
        while(dayNum<=7)
        {
            var day_name = dayFromTime(dayNum*10000);
            console.log("~"+day_name+"~")

            var entriesForThisDay = s[day_name];
            for(var v = 0; v < entriesForThisDay.length;v++)
            {
                var entry = entriesForThisDay[v];
                var time = entry.time;
                var course = entry.course;
                var slot = entry.slot;
                console.log(Math.floor((time.start%10000)/100) + ":" + (time.start%10000)%100 + "-" + Math.floor((time.end%10000)/100) + ":" + (time.end%10000)%100 + " --- " + course.name + " (" + course.number + ")" + ", Slot: " + slot.name + (slot.unavailable?(" (Note: Slot Unavailable) "):""))
            }

            console.log("----------------------");
            console.log()

            dayNum++;
        }

    }
}


function makeIterator(array){
    var nextIndex = 0;

    return {
        next: function(){
            return nextIndex < array.length ?
            {value: array[nextIndex++], done: false} :
            {done: true};
        }
    }
}


//returns an array of schedules, each schedule has items "sunday" thru "saturday" which contain arrays of courses that day
function breakSolsUpIntoDays(sols)
{

    var new_sols = [];

    for (var i = 0; i < sols.length; i++)
    {
        var solution = sols[i];
        var new_sol = {};
        new_sol.solution =solution;//keep track of original one.

        var dayNum = 1;
        while(dayNum<=7)
        {

            var entriesForThisDay = [];
            var day_name = dayFromTime(dayNum*10000);
            for(var course_number in solution)
            {
                var course_obj = solution[course_number];
                var course = course_obj.course;
                //console.log(course.name + " (" + course.number + ")");
                var slot = course_obj.slot;
                //console.log("Slot: " + slot.name)
                for(var m = 0; m < slot.times.length; m++)
                {
                    var time = slot.times[m];
                    if(Math.floor(time.start/10000)==dayNum)
                    {
                        //var day = dayFromTime(time.start)//safe to assume courses start and end on the same day.
                        entriesForThisDay.push({time:time, course:course, slot:slot});
                    }
                }
                //console.log();// new line
            }

            entriesForThisDay.sort(compareEntryTimes)

            new_sol[day_name]=entriesForThisDay;

            dayNum++;
        }

        new_sol.s_num = i;
        new_sols.push(new_sol);

    }

    consolidateSchedules(new_sols);
    return new_sols;
}

//for each s, adds to it times of when it's on/off on each day.
var day_suffix = "_consolidated";

//no return value. just applies directly to given input
function consolidateSchedules(schedules)
{
    for (var i = 0; i < schedules.length; i++)
    {
        var s = schedules[i];

        var dayNum = 1;
        while(dayNum<=7)
        {
            var day_name = dayFromTime(dayNum*10000);

            var entriesForThisDay = s[day_name];
            var times = [];
            s[day_name+day_suffix] = times;
            if(entriesForThisDay.length==0)
            {
                dayNum++;
                continue;
            }
            var entry1 = entriesForThisDay[0];
            var currentTime = {start:entry1.time.start, end:entry1.time.end};
            for(var v = 1; v < entriesForThisDay.length;v++)
            {
                var entry = entriesForThisDay[v];
                var time = entry.time;
                //we are guarenteed that there are no overlaps (otherwise this isn't a valid sol).
                //thus the only way these can continue each other is if they are directly touching.
                if(time.start===currentTime.end)
                {
                    currentTime.end = time.end;
                }
                else
                {
                    times.push(currentTime);
                    currentTime = {};
                    currentTime.start = time.start;
                    currentTime.end = time.end;
                }
            }
            times.push(currentTime);

            dayNum++;
        }

    }
}

/*
 *
 * Schedule Partitioner:
 *
 * day_name = day for which this is partitioning
 * times = array of times which this holds
 * id_num = unique num for this partitioner
 * schedules = array of schedules using this partitioner
 */

var partitioners = {};


var day_suffix_parts = "_partitioner";
function fitSchedulesIntoParts(schedules)
{

    for(var b = 10000; b <= 70000; b+=10000)
    {
        partitioners[dayFromTime(b)] = [];
    }


    for (var i = 0; i < schedules.length; i++)
    {
        var s = schedules[i];

        //loop over all days in schedule:

        for(var b = 10000; b <= 70000; b+=10000)
        {
            var day_name = dayFromTime(b);
            var day_times = s[day_name+day_suffix];
            s[day_name+day_suffix_parts] = getPartForDayForTimes(day_name, day_times, s.s_num);
        }


    }

}

//should be named possibleSchedules. Missnaming.
var possibleCourses = [];

function initPossibleCourses(schedules)
{

    for(var i = 0; i < schedules.length; i++)
    {
        possibleCourses.push(schedules[i].s_num);
    }
}
function mergeWithPartition(part)
{
    possibleCourses = intersect_arrays(possibleCourses, part.schedules);
}

function excludePartition(part)
{
    possibleCourses = arr_subt(possibleCourses, part.schedules);
}

function filterParts(partitioners)
{
    for(var i = 1; i <= 7; i++)
    {
        var day_name = dayFromTime(i*10000);
        var parts = partitioners[day_name];
        for(var j = 0; j < parts.length; j++)
        {
            var part = parts[j];
            var intersect = intersect_arrays(possibleCourses, part.schedules);
            if(intersect.length==0)
            {
                parts.splice(j,1);
                j--;
            }
        }
    }
    reorderParts(partitioners);
}

//to resolve id_num inside parts
function reorderParts(partitioners)
{
    for(var i = 1; i <= 7; i++)
    {
        var day_name = dayFromTime(i*10000);
        var parts = partitioners[day_name];
        for(var j = 0; j < parts.length; j++)
        {
            var part = parts[j];
            part.id_num=j;
        }
    }
}

function getPart(day_name, id_num)
{
    return partitioners[day_name][id_num];//yeah yeah not safe.. whatever...
}

function printParts(partitioners)
{
    console.log();//new line
    for(var i = 1; i <= 7; i++)
    {
        console.log();//new line
        var day_name = dayFromTime(i*10000);
        console.log(day_name);
        var parts = partitioners[day_name];
        if(parts.length <= 1)
        {
            console.log("No choices to make (either no choices possible or only 1 choice is possible)")
            if(parts.length==1)
                console.log("Must choose this part: " + JSON.stringify(parts[0]))
            continue;
        }
        for(var j = 0; j < parts.length; j++)
        {
            var part = parts[j];
            console.log(JSON.stringify(part));
        }
    }
}

/* finds the intersection of
 * two arrays in a simple fashion.
 *
 * PARAMS
 *  a - first array, must already be sorted
 *  b - second array, must already be sorted
 *
 * NOTES
 *
 *  Should have O(n) operations, where n is
 *    n = MIN(a.length(), b.length())
 */
function intersect_arrays(a, b)
{
    var ai=0, bi=0;
    var result = new Array();

    while( ai < a.length && bi < b.length )
    {
        if      (a[ai] < b[bi] ){ ai++; }
        else if (a[ai] > b[bi] ){ bi++; }
        else /* they're equal */
        {
            result.push(a[ai]);
            ai++;
            bi++;
        }
    }

    return result;
}

function union_arrays (x, y) {
    var obj = {};
    for (var i = x.length-1; i >= 0; -- i)
        obj[x[i]] = x[i];
    for (var i = y.length-1; i >= 0; -- i)
        obj[y[i]] = y[i];
    var res = []
    for (var k in obj) {
        if (obj.hasOwnProperty(k))  // <-- optional
            res.push(obj[k]);
    }
    return res;
}

//exclude: (e.g. don't have a specific schedule shown)
//removes a2 from a1 - order is important! (assumes both are sorted)
function arr_subt(a1, a2)
{
    var cleared = 0; //how many of a1 we have cleared
    for(var i = 0; i < a2.length && cleared < a1.length; i++)
    {

        var obj = a2[i];
        if(obj < a1[cleared])
            continue;
        if(obj==a1[cleared])
        {
            a1.splice(cleared, 1);
            continue;
        }
        cleared++;
        i--;
        //obj>a1[cleared] means that
    }

    return a1;
}

//yeah, yeah, day can be found from times, but we already found it above.. just leave...
function getPartForDayForTimes(day, times, s_num)
{

    var existingParts = partitioners[day];
    for(var i = 0; i < existingParts.length; i++)
    {

        var part = existingParts[i];

        var partTimes = part.times;

        if(partTimes.length!=times.length)continue;//no use to check

        var isMatch = true;
        for(var j = 0; j < partTimes.length; j++)
        {
            //all times are ordered, so it is safe to just compare one to one.
            var t1 = partTimes[j];
            var t2 = times[j];//we know lengths are equal

            if(t1.start!==t2.start || t1.end!==t2.end)
            {
                isMatch = false;
                break;
            }
        }

        if(isMatch)
        {
            part.schedules.push(s_num);
            return part;
        }

    }

    //no part found. create one.

    var new_part = {};
    new_part.day_name = day;
    new_part.id_num = existingParts.length;
    new_part.times = [];
    new_part.schedules = [s_num];

    for(var u = 0; u < times.length; u++)
    {
        new_part.times.push({start:times[u].start, end:times[u].end});
    }

    existingParts.push(new_part);
    return new_part;
}

function compareEntryTimes(a,b) {
    if (a.time.start < b.time.start)
        return -1;
    if (a.time.start > b.time.start)
        return 1;
    return 0;
}

function compareSolutionsByNumUnave(a, b)
{
    if(a.num_unave < b.num_unave)
        return -1;
    if(a.num_unave > b.num_unave)
        return 1;
    return 0;
}


function dayFromTime(time)
{
    switch (Math.floor(time/10000)){
        case 1:
            return "Sunday"
        case 2:
            return "Monday"
        case 3:
            return "Tuesday"
        case 4:
            return "Wednesday"
        case 5:
            return "Thursday"
        case 6:
            return "Friday"
        case 7:
            return "Saturday"
    }
}



function fitIntoSolutions(course, solutions)
{

    if(!solutions)
    {
        solutions = [];
        for(var i = 0; i < course.slots.length; i++)
        {
            var solution = {}
            solution[course.number] = {course:course, slot:course.slots[i]};
            solutions.push(solution);
        }
        return solutions;
    }

    var new_sols = [];

    for(var i = 0; i < course.slots.length; i++)
    {
        var slot = course.slots[i];
        adder: for(var j = 0; j < solutions.length; j++)
        {
            var solution = solutions[j];
            for(var course2_name in solution)
            {
                var course2slot = solution[course2_name].slot;
                if(doesCollide(course2slot, slot))
                {
                    continue adder;
                }
            }
            var addition = {};
            addition[course.number] = {course:course, slot:slot};
            new_sols.push(merge_options(solution, addition));
        }
    }

    return new_sols;
}

function doesCollide(slot1, slot2)
{
    //console.log("detecting collision between: " + JSON.stringify(slot1) + JSON.stringify(slot2))
    for(var i = 0; i < slot1.times.length; i++)
    {
        var time1 = slot1.times[i];
        for(var j = 0; j < slot2.times.length; j++)
        {
            var time2 = slot2.times[j];
            //console.log(time2);
            //console.log(time1);
            if((time2.start <= time1.start && time2.end > time1.start) || (time2.start < time1.end && time2.end>=time1.end))
            {
                return true;
            }
        }
    }
    return false;
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}


//START:
operateOnCoursesToRead();




//Reader:
var checkAvs = {};
//key = course_num
//to check av, add an object of the form:
/*
 * course_num:...
 * callback:...
 * old_slots:...
 */
var waitToCheckAvsTillNumberReaches = 0;//increment any time we get lots of av requests at once

var slotsWhichYouMustHaveAccessTo = {};//these are slots which you are already signed up for.
//usage: {course_num:slot}


function readCourse(course_num, callback, shouldCheckAv, course_data)
{

    //means we have a reserved slot

    console.log("received course_num: " + JSON.stringify(course_num));
    if( Object.prototype.toString.call( course_num ) === '[object Array]'){
        console.log("course_num is an array")
        if(shouldCheckAv)
            waitToCheckAvsTillNumberReaches += course_num.length;
        for(var i = 0; i < course_num.length; i++)
        {
            var course = course_num[i];
            readCourse(course, callback, shouldCheckAv, course_data);
        }
        return;
    }

    if(typeof course_num === typeof {} && typeof course_num !== typeof '' && typeof course_num !== "")
    {
        console.log("Splitting: " + course_num)
        var num = course_num.course;
        var slot = course_num.slot;
        slotsWhichYouMustHaveAccessTo[num] = slot;
        course_num = num;//so that rest of alg can work with this
    }

    //Validate course number: (If it doesn't match the criteria, error out)
    if(!validate(course_num))
    {
        console.log("Incorrect formatting for course: " + course_num);
        callback(course_num, []);
        return;
    }


    //As we are not using node, this will always fail and resort to grabbing the HTML on it's own
    //Attempt to read slots from memory (JSON):
    try{
        var old_slots = JSON.parse(fs.readFileSync("./files/"+filePrefix+course_num+"_json", 'utf8'));
        console.log("Loaded old slots for course: " + course_num)
        if(shouldCheckAv)
        {
            checkAvs[course_num]={course_num:course_num, callback:callback, old_slots:old_slots}
            checkAv();
        }
        else
            callback(course_num,old_slots);
        return;
    }
    catch(e)
    {
        //Do nothing
    }

    var data = course_data;
    if(!data){
        try{
            data = fs.readFileSync("./files/"+filePrefix+course_num, 'utf8')
            console.log("Data file exists for course: " + course_num);
        }
        catch (e)
        {
            console.log("Data file doesn't exist for course: " + course_num);
            getCourseByNumber(course_num, readCourse, [course_num, callback]);
            return;
        }
    }
    else
    {
        /*
        try {
            //called if data was sent to us by grabber. save data to file named filePrefix+course_num

            fs.writeFile("./files/" + filePrefix + course_num, data, function (err) {
                if (err) {
                    console.log(err);
                }

                console.log("Saved file for course: " + course_num);
            });
        }
        catch(e){}*/
    }

    var slots = [];//retval

    var entriesArray = data.split("\n");
    var keep = [];
    var slot_numbers = [];//no strong enfourcement between slot numbers and keep - just assume everything works nicely. parsing html sucks.
    for(var j = 0; j < entriesArray.length; j++)
    {
        var entry = entriesArray[j];
        if(entry.indexOf("</td><td>")!=-1)
        {
            keep.push(entry);
            //console.log(entry);
        }
        else
        {
            var index = entry.indexOf("<tr><td class=\"hide-on-tablet\">");
            if(index!=-1)
            {
                slot_numbers.push(entry.substring(index + "<tr><td class=\"hide-on-tablet\">".length, entry.indexOf("</td>", index + "<tr><td class=\"hide-on-tablet\">".length)))
            }
        }
    }

    var lettersToEvalOver = "שוהדגבא".split("");
    //console.log(lettersToEvalOver);

    for(var j = 0; j < keep.length; j++)
    {
        var line = keep[j];
        //Just assume everything is valid, ignore classification
        //var hasBeenClassified = false;
        for(var i = 0; /*!hasBeenClassified &&*/ /*i < lettersToEvalOver.length*/ i==0 /*not doing eval, so run loop only once*/; i++)
        {
            //result holds indexies
            var result = [];
            line.replace(/(<\/td><td>)/g, function (a, b, index) {
                result.push(index);
            });
            result; // [0, 4]


            var searchLength = "</td><td>".length;
            //console.log(result);
            /*
             for(var u = 0; u < result.length; u++)
             {
             var ind = result[u] + searchLength;
             var next_ind = line.indexOf("<br />", ind);
             console.log(line.substring(ind, next_ind));
             }
             */

            //First day:
            //console.log(line.substring(result[1]+searchLength, result[2]));
            var days = line.substring(result[1]+searchLength, result[2]).split("<br />");
            days.splice(days.length-1, 1);//remove the empty string
            //console.log(days);


            //First time:
            //console.log(line.substring(result[2]+searchLength, result[3]));
            var hours = line.substring(result[2]+searchLength, result[3]).split("<br />");
            hours.splice(hours.length-1, 1);
            //console.log(hours);


            var slot = {};

            var slot_num = slot_numbers[j];//keep this unsafe (not checking whether j is < slot_numbers.length) --- it's supposed to be, if not, the HTML isn't formatted correctly and this will raise an error telling us so.

            slot.name = "Group " + slot_num;
            slot.times = [];

            for(var d = 0; d < days.length; d++)//assume days and hours have same length -- if not, it's best we get an error cuz HTML is wrong
            {
                var time = {};
                var time_prefix = getTimePrefixFromDay(days[d])*10000;
                var split_time = hours[d].split(" - ");
                var startSplit = split_time[0].split(":");
                time.start = time_prefix+ startSplit[0]*100 + (startSplit[1]<10?startSplit[1]*10:startSplit[1]);//sometimes they dont add zeros to the minutes.. eg half past ten can be 10:3
                var endSplit = split_time[1].split(":");
                time.end = time_prefix+ endSplit[0]*100 + (endSplit[1]<10?endSplit[1]*10:endSplit[1]);

                slot.times.push(time);
            }

            slots.push(slot);

            /*
             var letter = lettersToEvalOver[i];
             var index = keep.indexOf("</td><td>"+letter+"<br />");
             if(index!=-1)
             {
             hasBeenClassified = true;
             console.log(letter);
             }*/
        }
    }

    //console.log(JSON.stringify(slots));


    if(shouldCheckAv)
    {
        checkAvs[course_num]={course_num:course_num, callback:callback, old_slots:slots}
        checkAv();
    }
    else
        callback(course_num,slots);
    //Save extracted slots to file. No need to check whether already saved cuz if already saved then it would have existed at the begining of the method and we would never have gotten here.

    /*
    fs.writeFile("./files/"+filePrefix+course_num+"_json", JSON.stringify(slots), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("Saved extracted slots for course: " + course_num);
    });*/
}

function getTimePrefixFromDay(day)
{

    switch(day)
    {
        case "א":
            return 1;
        case "ב":
            return 2;
        case "ג":
            return 3;
        case "ד":
            return 4;
        case "ה":
            return 5;
        case "ו":
            return 6;
        case "ש":
            return 7;
    }

}


function validate(course_num)
{

    //Is string:
    if(typeof course_num !== typeof "")
    {
        console.log(course_num + " failed validation on stage 1");
        return false;
    }

    if(course_num.length!==course_num_length)
    {
        console.log(course_num + " failed validation on stage 2" + " " + course_num.length + " " + course_num_length);
        return false;
    }
    if(!isNum(course_num))
    {
        console.log(course_num + " failed validation on stage 3");
        return false;
    }

    return true;
}

var expiration_for_old_ave = 1000 * 60 * 15;//expires in 15 min
var skipRepull = true;//use this when time is between 10pm - 8am cuz during those times tech's website will be offline and not return data
var forceRepull = false;
//forceRepull overrides skipRepull incase of conflict

function checkAv(course_num, callback, current_slots)
{
    var current_length = Object.keys(checkAvs).length;
    console.log("check avs recevied. " + current_length + " " + waitToCheckAvsTillNumberReaches);
    if(current_length!=waitToCheckAvsTillNumberReaches)
        return;
    else
    {
        var course_nums = [];
        for(var course in checkAvs)
        {

            //Sync check for files in local system. It's ok to do sync - not much data to read. annoying to format code for async.

            try{
                var old_ave = JSON.parse(fs.readFileSync("./files/"+filePrefix+course+"_availability_json", 'utf8'));
                console.log("Loaded old availability for course: " + course)

                if(!forceRepull && (old_ave.timestamp + expiration_for_old_ave > Date.now() || skipRepull))
                {
                    console.log("Skipping check for ave and using previous data from: " + old_ave.timestamp + ". Time now is: " + Date.now());
                    checkAvCallback(course, 0 , old_ave.ave);
                }
                else
                    throw new Exception();//will go to catch below

            }
            catch(e)
            {
                console.log("queing to check for ave")
                course_nums.push(course)
            }

        }
        if(course_nums.length)
            getCourseVacancy(course_nums, checkAvCallback, [], false, 0, false);
    }

}

//if you pass in availability, it will take that instead of reading any html.
/*
 * Availability should be an array of available slot numbers
 */
function checkAvCallback(course_num, html, availability)
{
    var prev_dat = checkAvs[course_num];
    delete checkAvs[course_num];
    waitToCheckAvsTillNumberReaches--;

    //console.log(arguments)

    //filter out only important lines:
    var keep = [];

    if(availability)
        keep = availability;
    else
    {
        var entriesArray = html.split("\n");
        for(var i = 0; i < entriesArray.length; i++)
        {
            var entry = entriesArray[i];

            //filter strategy:
            /*
             * take index of <td>, then check if next word is a number and if so, if it is followed by </td>
             * this will filter out only the slot nums
             */

            var index = entry.indexOf("<td>");
            var index2 = entry.indexOf("<\/td>");
            if(index==-1 || index2 ==-1)continue;

            var substring = entry.substring(index+"<td>".length, index2);
            //console.log(index + " " + index2 + " " + substring)


            if(isNum(substring))
            {
                keep.push(substring);
            }

        }

        /*
        //Save extracted keep:
        fs.writeFile("./files/"+filePrefix+course_num+"_availability_json", JSON.stringify({ave:keep, timestamp:Date.now()}), function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("Saved ave for course: " + course_num);
        });*/
    }

    //push slotsWhichYouMustHaveAccessTo to keep:

    var slotEnsuredForThisCourse = slotsWhichYouMustHaveAccessTo[course_num];
    if(slotEnsuredForThisCourse)
    {
        keep.push(slotEnsuredForThisCourse);
        console.log("Slot ensured for: " + course_num + " is: " + slotEnsuredForThisCourse);
    }
    console.log("keep")
    console.log(keep);
    console.log(prev_dat.old_slots);



    //mark slots as having/not having ave:
    for (var m = 0; m < prev_dat.old_slots.length; m++)
    {
        var slot = prev_dat.old_slots[m];
        //console.log("Slot: " + slot.name);
        var foundAve = false;
        for(var j = 0; j < keep.length; j++)
        {
            var s = keep[j];
            //console.log("keep: " + s);
            if(slot.name.indexOf(s)!=-1)
            {
                foundAve = true;
                break;
            }
        }
        slot.unavailable = !foundAve;
    }


    //delete un-ave slots:
    /*
     *
     * var slots = [];
     outer: for(var k = 0; k < keep.length; k++)
     {
     var s = keep[k];

     for( var i = 0; i < prev_dat.old_slots.length; i++)
     {
     var slot = prev_dat.old_slots[i];
     if(slot.name.indexOf(s)!=-1)
     {
     slots.push(slot);
     continue outer;
     }
     }
     }
     */
    console.log("filtered slots: " + JSON.stringify(prev_dat.old_slots));

    if(!testing)
        prev_dat.callback(course_num, prev_dat.old_slots);
}

function isNum(num){
    return !isNaN(num)
}

var testing = false;

if(testing)
{
    readCourse(["234114", "104166"], 0, true, 0);
}




//Grabber:
var request = require("request").defaults({jar: true})
var didAuth = false;


/*
function httpGetAsync(theUrl, callback, args, push)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}*/

//if pushRes = true -> body = {body:body, res:res}. use if you need to get res headers
function getURL(theUrl, callback, args, push, optionsAddition, pushRes) {
    console.log("getting url: " + theUrl)

    /*
    options = merge_options({
        method : 'GET',
        url : url
    }, optionsAddition);*/

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        {
            var body = xmlHttp.responseText;
            if(pushRes)
            {
                console.log("attaching res")
                body = {body:body, res:res};
            }
            try {
                a = JSON.parse(body);
                body = a;// So that if error is called, we do not touch body
                // yet.
            } catch (e) {
                // Nothing
            }
            if (!push) {
                args.push(body);
            } else {
                var lastArg = args[args.length - 1];
                lastArg.push(body);
            }
            // console.log("Callback: " + callback + " args: " + args)
            callback.apply(this, args)
        }
    }

    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);


}

function merge_options(obj1,obj2){
    if(!obj1)return obj2;
    if(!obj2)return obj1;//incase either obj are undefined
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}


function getCourseByNumber(courseNum, callback, args, push)
{
    getURL("https://ug3.technion.ac.il/rishum/course/"+courseNum, callback, args, push);
}

//In options pass cookie website sign in.
//callback's second to last arg will be the course_num requested
function getCourseVacancy(courseNum, callback, args, push, options, pushRes)
{
    if(!didAuth)
    {
        auth(exports.getCourseVacancy, arguments);//use arguments already got
        return;
    }

    var courses = []
    if(typeof courseNum === typeof [])
        courses = courseNum;
    else
        courses = [courseNum]

    var currentArgCount = args.length;
    args.push("");

    for(var i = 0; i < courseNum.length; i++)
    {
        args = args.slice(0);//clones array
        args[currentArgCount] = courseNum[i];
        getURL("http://ug3.technion.ac.il/rishum/vacancy/"+courseNum[i], callback, args, push, options, pushRes)
    }

}

/*exports.getCourseVacancy("234114", function(data)
 {
 console.log(data);
 }, [], false, extraOps);
 */

var credentials = {
    OP:"LI",
    UID: "209346188",
    PWD: "00301671",
    "Login.x":'%D7%94%D7%AA%D7%97%D7%91%D7%A8'
};


function auth(callback, args)
{
    console.log("starting auth (0)")
    request.post({
        uri: 'http://ug3.technion.ac.il/rishum/login',
        headers: {
            "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:39.0) Gecko/20100101 Firefox/39.0",
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language":"en-US,en;q=0.5",
            //"Accept-Encoding":"gzip, deflate",
            "Referer":"https://ug3.technion.ac.il/rishum/login",
            "Cookie":"_ga=GA1.3.939672866.1444235832; lubl=https%3A%2F%2Fug3.technion.ac.il%2Frishum%2Fvacancy%2F234114; _gat=1",
            "Connection":"keep-alive",
            "Content-Type":"application/x-www-form-urlencoded"//,
            //"POSTDATA":"OP=LI&UID=209346188&PWD=00301671&Login.x=%D7%94%D7%AA%D7%97%D7%91%D7%A8"

        }
        ,body: "OP=LI&UID="+credentials.UID+"&PWD="+credentials.PWD+"&Login.x=%D7%94%D7%AA%D7%97%D7%91%D7%A8"//require('querystring').stringify(credentials)
    }, function(err, res, body){

        console.log("starting auth (1)")
        if(err) {
            console.log(err)
            return;
        }

        //console.log(body);

        if(testing)
        {
            runCourseVacancyTest();
        }

        didAuth = true;
        callback.apply(this, args);

        // do scraping
    });
}


function runCourseVacancyTest()
{
    exports.getCourseVacancy("234114", function(data)
    {
        console.log("vacancy")
        //console.log(data)
        console.log(data.body);
        //console.log(data.res);
    }, [], false,0 ,true);
}