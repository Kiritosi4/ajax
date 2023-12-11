$(document).ready(function() {
    // Local storages
    let localPosts = [];
    let localUsers = [];

    let currentOperation = "";
    let currentPostId = "";

    //Ini
    if(localStorage.getItem("themeId") === "1"){
        $('#theme').attr("href", "dark.css");
        localStorage.setItem("themeId", 1);
    }

    // Fetch posts and render them 222
    function RequestPosts() {
        $.ajax({
            url: 'https://jsonplaceholder.typicode.com/posts',
            method: 'GET',
            success: function(posts) {
                localPosts = posts;
                $.ajax({
                    url: 'https://jsonplaceholder.typicode.com/users',
                    method: 'GET',
                    success: function(users) {
                        localUsers = users;

                        let userSelector = $('#user-selector');
                        userSelector.empty();
                        localUsers.forEach(function(user){
                            userSelector.append(`<option value="${user.id}">${user.name}</option>`);
                        });

                        DisplayPosts(localPosts, localUsers);
                        $('#loader').hide();
                    },
                });
            },

        });
    }

    function DisplayPosts(posts, users) {
        $('#posts-container').empty();

        let importantPostIds = JSON.parse(localStorage.getItem('ImportantPosts'));

        if(importantPostIds !== null)
            posts.sort((a, b) => importantPostIds.includes(a.id) > importantPostIds.includes(b.id) ? -1 : 1);


        posts.forEach(function(post) {
            if(importantPostIds !== null && importantPostIds.includes(post.id)){
                $('#posts-container').append(`
                <div class="important-post">
                    <h3>${post.title}</h3>
                    <p>${post.body}</p>
                    <p>Created by: ${users[post.userId-1].name}</p>
                    <button class="edit-post-btn" data-id="${post.id}">Edit</button>
                    <button class="delete-post-btn" data-id="${post.id}">Delete</button>
                    <button class="not-important-post-btn" data-id="${post.id}">Not important</button>
                </div>
            `);
            }else{
                $('#posts-container').append(`
                <div class="post">
                    <h3>${post.title}</h3>
                    <p>${post.body}</p>
                    <p>Created by: ${users[post.userId-1].name}</p>
                    <button class="edit-post-btn" data-id="${post.id}">Edit</button>
                    <button class="delete-post-btn" data-id="${post.id}">Delete</button>
                    <button class="important-post-btn" data-id="${post.id}">Important</button>
                </div>
            `);
            }
        });
    }

    RequestPosts();

    $('#create-post-btn').click(function() {
        //let window = $('#post-modal');
        //window.attr("data-operation", "create");
        //window.show();
        currentOperation = "create";
        $('#post-modal').show();
    });

    $('.close').click(function() {
        $('.modal').hide();
    });

    // Theme change
    $('#theme-btn').click(function() {
        if(localStorage.getItem("themeId") === "0"){
            $('#theme').attr("href", "dark.css");
            localStorage.setItem("themeId", 1);
        }else{
            $('#theme').attr("href", "light.css");
            localStorage.setItem("themeId", 0);
        }
    });

    // Handle form submission for creating/editing a post
    $('#post-form').submit(function(event) {
        event.preventDefault();

        const title = $('#title').val();
        const body = $('#body').val();
        const userId = $('#user-selector').val();

        // Validate userId
        if (userId < 1 || userId > 10) {
            alert('Invalid User ID. Please enter a number between 1 and 10.');
            return;
        }

        let data = {
            title: title,
            body: body,
            userId: userId
        };
        
        const form = $('#post-modal');

        if(currentOperation == "create"){
            $.ajax({
                url: 'https://jsonplaceholder.typicode.com/posts',
                method: 'POST',
                data: data,
                success: function(newPost) {
                    newPost['id'] = localPosts.length + 1
                    localPosts.push(newPost);
                    form.hide();
                    DisplayPosts(localPosts, localUsers);
                }
            });
        }else{
            data['id'] = currentPostId;
            localPosts[data['id']-1] = data;

            $.ajax({
                url: 'https://jsonplaceholder.typicode.com/posts',
                method: 'POST',
                data: data,
                success: function(newPost) {
                    form.hide();
                    DisplayPosts(localPosts, localUsers);
                }
            });
        }
    });

    function MakeNotImportant(postId){
        let importantPostIds = JSON.parse(localStorage.getItem('ImportantPosts')).filter(x => x != postId);
        localStorage.setItem('ImportantPosts', JSON.stringify(importantPostIds));
    }

    function DeletePost(postId){
        MakeNotImportant(postId);
        
        $.ajax({
            url: `https://jsonplaceholder.typicode.com/posts/${postId}`,
            method: 'DELETE',
            success: function() {
                localPosts = localPosts.filter(post => post.id !== postId);
                DisplayPosts(localPosts, localUsers); // Обновляем интерфейс после успешного удаления поста
            }
        });
    }

    // Handle post deletion
    $('#posts-container').on('click', '.delete-post-btn', function() {
        const postId = $(this).data('id');
        const importantPostIds = JSON.parse(localStorage.getItem('ImportantPosts'));

        if(importantPostIds.includes(postId) && !confirm("Delete post?")){
            return;
        }

        DeletePost(postId);
    });

    // Show post window
    $('#posts-container').on('click', '.edit-post-btn', function() {
        const postId = $(this).data('id');
        const post = localPosts.find((x) => x.id == postId);

        $('#title').val(post.title);
        $('#body').val(post.body);
        $('#userId').val(post.userId);

        // Show the modal
        //let window = $('#post-modal');
        //window.attr("data-operation", "edit");
        //window.attr("data-postid", postId);
        currentOperation = "edit";
        currentPostId = postId;
        $('#post-modal').show();
    });

    $('#posts-container').on('click', '.important-delete-post-btn', function() {
        const postId = $(this).data('id');
        
        $('#delete-confirm').attr("data-id", postId);
        $('#delete-confirm').show();
    });

    // Make important
    $('#posts-container').on('click', '.important-post-btn', function() {
        const postId = $(this).data('id');
        
        let importantPostIds = new Set(JSON.parse(localStorage.getItem('ImportantPosts')));
        importantPostIds.add(postId);
        localStorage.setItem('ImportantPosts', JSON.stringify(Array.from(importantPostIds)));

        DisplayPosts(localPosts, localUsers);
    });

    $('#posts-container').on('click', '.not-important-post-btn', function() {
        const postId = $(this).data('id');

        MakeNotImportant(postId);
        DisplayPosts(localPosts, localUsers);
    });
});
