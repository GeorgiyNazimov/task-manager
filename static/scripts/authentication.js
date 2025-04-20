document.getElementById('login_button').addEventListener("click", login_or_reg);
document.getElementById('registration_button').addEventListener("click", login_or_reg);


function login_or_reg() {
    const username = document.getElementsByClassName('username')[0].value;
    const password = document.getElementsByClassName('password')[0].value;
    let is_registration = ''
    if (this.id == 'login_button')
        is_registration = false
    else
        is_registration = true
    console.log(username, password, is_registration)
    let data = JSON.stringify({ "username": username, "password": password, "is_registration": is_registration });
    console.log(data)

    let xhr = new XMLHttpRequest();
    url = "http://localhost:8000/login";
    xhr.open("POST", url, false);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
    if (JSON.parse(xhr.response) == true){
        //console.log('redirect')
        window.location = 'http://localhost:8000/account'
        //console.log('redirected')
    }
}