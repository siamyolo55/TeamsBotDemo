
const formattedTime = (loginTime, OFFICE_HOURS = 8) => {
    let hour = loginTime.getHours()
    let min = String(loginTime.getMinutes())
    min.length == 1 ? min = '0' + min : min = min
    let amOrPm = " AM"
    if(hour > 12){
        hour %= 12
        hour = '0' + String(hour)
        amOrPm = " PM"
    }
    else if(hours < 12) hour = '0' + String(hour)
    hour = String(hour)
    let startTime = hour + ':' + min + amOrPm

    let timeToLeave = new Date(loginTime.getTime() + OFFICE_HOURS * 60000 * 60)
    hour = timeToLeave.getHours()
    min = String(timeToLeave.getMinutes())
    min.length == 1 ? min = '0' + min : min = min
    amOrPm = " AM"
    if(hour > 12){
        hour %= 12
        hour = '0' + String(hour)
        amOrPm = " PM"
    }
    else if(hours < 12) hour = '0' + String(hour)
    hour = String(hour)
    timeToLeave = hour + ':' + min + amOrPm
    return {
        startTime,
        timeToLeave
    }
}

module.exports = formattedTime