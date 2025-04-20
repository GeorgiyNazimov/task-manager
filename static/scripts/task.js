document.addEventListener('DOMContentLoaded', init_tasks)
document.getElementById('logout_button').addEventListener('click', logout);
document.getElementById('add_user_task_button').addEventListener('click', create_task)
document.getElementsByClassName('redactor_button')[0].addEventListener('click', save_task)
document.getElementsByClassName('redactor_button')[1].addEventListener('click', close_redactor)
task_window = document.getElementsByClassName('tasks')[0]
redactor = document.getElementById('redactor')
redactor_last_call_id = null

user_data = {}

stable_tasks = new Map()
changed_tasks = new Map()
created_tasks = new Map()
deleted_tasks = new Array()

next_unstable_task_ind = 0

function init_tasks() {
    let req = new XMLHttpRequest()
    url = "http://localhost:8000/account/tasks"
    req.open('GET', url, false)
    req.send()
    tasks = JSON.parse(req.response)
    user_data = tasks[0]
    document.getElementsByClassName('username')[0].innerText = user_data['username']
    tasks = tasks[1]
    for (let i = 0; i < tasks.length; i++) {
        stable_tasks.set(tasks[i].id, tasks[i])
        new_task_element = create_task_element(tasks[i].id, tasks[i])
        insert_task(new_task_element)
    }
}

function logout() {
    synchronize()
    let req = new XMLHttpRequest()
    url = "http://localhost:8000/logout"
    req.open('GET', url, false)
    req.send()
    window.location = 'http://localhost:8000/login'
}

function open_redactor() {
    redactor.style.visibility = 'visible'
}

function close_redactor() {
    redactor.getElementsByClassName('task_name_redactor')[0].value = ''
    redactor.getElementsByClassName('task_text_redactor')[0].value = ''
    redactor.style.visibility = 'hidden'
}

function save_task() {
    if (redactor_last_call_id == null) {
        task_data = {}
        while (stable_tasks.has(next_unstable_task_ind) || created_tasks.has(next_unstable_task_ind) || changed_tasks.has(next_unstable_task_ind)) {
            next_unstable_task_ind++
        }
        task_data_id = next_unstable_task_ind
        task_data.user_id = user_data['user-id']
        next_unstable_task_ind++
        get_task_data_from_redactor(task_data)
        created_tasks.set(task_data_id, task_data)
        task_element = create_task_element(task_data_id, task_data)
        insert_task(task_element)
        close_redactor()
    }
    else {
        task_data = { 'id': redactor_last_call_id }
        get_task_data_from_redactor(task_data)
        if (created_tasks.has(task_data.id)) {
            created_tasks.set(task_data.id, task_data)
        }
        else {
            if (stable_tasks.has(task_data.id))
                stable_tasks.delete(task_data.id)
            changed_tasks.set(task_data.id, task_data)
        }
        update_task_element(task_data)
        close_redactor()
    }
}

function get_existing_task_data(id) {
    task_element = document.getElementById(`element_${id}`)
    task = {}
    task.id = id
    task.task_name = task_element.getElementsByClassName('user_task_header_name')[0].innerText
    task.text = task_element.getElementsByClassName('user_task_description')[0].innerText
    return task
}

function insert_existting_task_data_in_redactor(task_data) {
    redactor.getElementsByClassName('task_name_redactor')[0].value = task_data.task_name
    redactor.getElementsByClassName('task_text_redactor')[0].value = task_data.text
}

function get_task_data_from_redactor(task_data) {
    task_data.task_name = redactor.getElementsByClassName('task_name_redactor')[0].value
    task_data.text = redactor.getElementsByClassName('task_text_redactor')[0].value
}

function update_task() {
    if (this.id.split('_')[0] == 'element') {
        close_redactor()
        element_id = Number(this.id.split('_')[1])
        task_data = get_existing_task_data(element_id)
        insert_existting_task_data_in_redactor(task_data)
        redactor_last_call_id = element_id
        redactor.getElementsByClassName('redactor_buttons')[0].firstElementChild.innerText = 'Сохранить'
        open_redactor()
    }
}

function create_task() {
    close_redactor()
    redactor_last_call_id = null
    console.log(redactor.getElementsByClassName('redactor_buttons'))
    redactor.getElementsByClassName('redactor_buttons')[0].firstElementChild.innerText = 'Создать'
    open_redactor()
}

function update_task_element(task_data) {
    task_element = document.getElementById(`element_${task_data.id}`)
    create_task_element_innerHTML(task_element, task_data.id, task_data)
}

function create_task_element(task_data_id, task_data) {
    new_element = document.createElement('div')
    new_element.className = 'account_element'
    new_element.id = `element_${task_data_id}`
    new_element.onclick = update_task
    create_task_element_innerHTML(new_element, task_data_id, task_data)
    return new_element
}

function create_task_element_innerHTML(task_element, task_data_id, task_data) {
    task_element.innerHTML = `
    <div class="user_task_header">
        <div class="user_task_header_name">${task_data.task_name}</div>
        <button class="user_task_header_delete_button" id="delete_${task_data_id}" onclick='delete_task()'">
            <img src='static/pic/trash_can.png' width="100%" alt="удалить">
        </button>
    </div>
    <div class="user_task_description">${task_data.text}</div>`
}

function insert_task(new_task_element) {
    task_window.insertBefore(new_task_element, task_window.lastElementChild)
}

function delete_task() {
    ind = Number(event.currentTarget.id.split('_')[1])
    deleted_task = document.getElementById(`element_${ind}`)
    while (deleted_task.firstChild) {
        deleted_task.removeChild(deleted_task.firstChild)
    }
    deleted_task.parentElement.removeChild(deleted_task)
    if (created_tasks.has(ind))
        created_tasks.delete(ind)
    if (changed_tasks.has(ind)) {
        deleted_tasks.push(ind)
        changed_tasks.delete(ind)
    }
    if (stable_tasks.has(ind)) {
        deleted_tasks.push(ind)
        stable_tasks.delete(ind)
    }
    event.stopPropagation()
}

function synchronize() {
    console.log('synchronize')
    if(Array.from(changed_tasks.values()).length || Array.from(created_tasks.values()).length || deleted_tasks.length){
        let req = new XMLHttpRequest()
        url = "http://localhost:8000/account/synchronize"
        req.open('POST', url, false)
        req.setRequestHeader("Content-Type", "application/json")
        req.send(JSON.stringify({ 'changed_tasks': Array.from(changed_tasks.values()), 'created_tasks': Array.from(created_tasks.values()), 'deleted_tasks': deleted_tasks }))
        console.log(user_data)
        console.log(req.response)
        if(req.status == 200){
            console.log(req.status)
            deleted_tasks = new Array()
            for(let task of changed_tasks){
                stable_tasks.set(task[0], task[1])
                changed_tasks.delete(task[0])
            }
            let i = 0
            let l = created_tasks.entries().length
            let new_task_indexes = JSON.parse(req.response)
            for(let [key, val] of created_tasks){
                task_element = document.getElementById(`element_${key}`)
                create_task_element_innerHTML(task_element, new_task_indexes[i], val)
                task_element.id = `element_${new_task_indexes[i]}`
                stable_tasks.set(new_task_indexes[i], val)
                i++
            }
            created_tasks = new Map()
        }
    }
}

setInterval(synchronize, 300000)