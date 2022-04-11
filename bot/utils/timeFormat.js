
const formattedTime = (loginTime, OFFICE_HOURS = 8) => {
    // am == 0 pm == 1
    let amOrPm = null
    let hour = loginTime.getHours()
    let min = String(loginTime.getMinutes())
    
    if(hour >= 12){
        amOrPm = 1
        hour %= 12
    }
    else amOrPm = 0
    hour < 10 ? hour = '0' + String(hour) : hour = String(hour)
    min.length == 1 ? min = '0' + min : min = min
    let startTime = hour + ':' + min + (amOrPm ? " PM" : " AM") 
    

    let timeToLeave = new Date(loginTime.getTime() + OFFICE_HOURS * 60000 * 60)
    hour = timeToLeave.getHours()
    min = String(timeToLeave.getMinutes())
    if(hour >= 12){
        amOrPm = 1
        hour %= 12
    }
    else amOrPm = 0
    hour < 10 ? hour = '0' + String(hour) : hour = String(hour)
    min.length == 1 ? min = '0' + min : min = min
    timeToLeave = hour + ':' + min + (amOrPm ? " PM" : " AM") 
    return {
        startTime,
        timeToLeave
    }
}

module.exports = formattedTime