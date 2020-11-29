const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const p = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'users.json'
);

const q = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'cards.json'
);

const r = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'ratings.json'
);


const users = [];


app.set('view engine', 'ejs');
app.set('views','views');
app.use(express.urlencoded({ extended: false }));

app.get('/login',(req,res,next)=>{
    res.render('login',{
        errorMsg : false
    });
});

app.post('/add-user-card-details',(req,res,next)=>{
    console.log(req.body);
    fs.readFile(q,(err,fileContent)=>{
        userCardList = [];
        if(!err){
            userCardList = JSON.parse(fileContent);
            console.log("usercardlist" , userCardList);
        }
        userNeeded = userCardList.find(
            user => user.id === req.body.id
        );
        console.log(userNeeded);
        if(typeof userNeeded === 'undefined'){
            userNeeded = {id : req.body.id, cards : []};
            userNeeded.cards.push(req.body.title);
            console.log(userNeeded);
            userNeededIndex = 0;
        }
        else{   
            userNeeded.cards.push(req.body.title);
            console.log(userNeeded);
            userNeededIndex = userCardList.findIndex(
                user => user.id === req.body.id
            );
            console.log(userNeededIndex);
        }
        userCardList[userNeededIndex] = userNeeded;
        console.log("new", userCardList);
        fs.writeFile(q,JSON.stringify(userCardList),err=>{
            console.log(err);
        });
    });
    const url = '/dashboard/'+req.body.id;
    res.redirect(url);
});

app.post('/add-user-card',(req,res,next)=>{
    console.log(req.body.id);
    res.render('add-card',{
        userId : req.body.id
    });
})


app.post('/card-done',(req,res,next)=>{
    console.log(req.body);
    index = parseInt(req.body.index);
    id = req.body.id;

    fs.readFile(q,(err,fileContent)=>{
        if(!err){
            userCardList = JSON.parse(fileContent);
            userNeeded = userCardList.find(
                user=>user.id === id
            );
            userNeededIndex = userCardList.findIndex(
                user=>user.id === id
            );
            userNeeded.cards.splice(index,1);
            userCardList[userNeededIndex] = userNeeded;
            fs.writeFile(q,JSON.stringify(userCardList),err=>{
                console.log(err);
            });
        }
    });

    const url = '/dashboard/'+id;
    res.redirect(url);
});

app.post('/rate-us-details',(req,res,next)=>{
    console.log(req.body);
    userRating = req.body;
    fs.readFile(r,(err,fileContent)=>{
        ratings =[];
        if(!err){
            ratings = JSON.parse(fileContent);
        }
        ratings.push(userRating);
        fs.writeFile(r,JSON.stringify(ratings),err=>{
            console.log(err);
        });
    });
    const url = '/dashboard/'+req.body.id;
    res.redirect(url)
})


app.post('/rate-us',(req,res,next)=>{
    console.log(req.body);
    res.render('rate-us.ejs',{
        userId : req.body.id
    });
    
})

app.get('/dashboard/:userId',(req,res,next)=>{
    const userId = req.params.userId;
    console.log(userId);
    fs.readFile(q,(err,fileContent)=>{
        userCardList = [];
        if(!err){
            userCardList = JSON.parse(fileContent);
        }
        
        userNeeded = userCardList.find(
            user => user.id === userId
        );
        
        if(typeof userNeeded === 'undefined'){
            userNeeded = {id : '', cards : []};
        }

        console.log(userNeeded.cards);
        res.render('dashboard',{
            userId : userId,
            cards : userNeeded.cards
        });
    });
    
})


app.post('/edit-user-details', async(req,res,next)=>{

    //console.log(req.body);
    updatedUser = req.body;
    console.log(updatedUser);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    updatedUser.password = hashedPassword;
    console.log(updatedUser);
    fs.readFile(p,(err,fileContent)=>{
        if(!err){
            userList = JSON.parse(fileContent);
            const existingUserIndex = userList.findIndex(
                user => user.id === req.body.id
            );
            userList[existingUserIndex] = updatedUser;
            fs.writeFile(p,JSON.stringify(userList),err=>{
                console.log(err);
            });
            const url = '/dashboard/'+updatedUser.id;
            console.log(url);
            res.redirect(url);
        }
    });
});

app.post('/edit-user',(req,res,next)=>{
    console.log(req.body);

    fs.readFile(p,(err,fileContent)=>{
        if(!err){
            userList = JSON.parse(fileContent);
            const existingUser = userList.find(
                user => user.id === req.body.id
            );
            //console.log(existingUser);
            res.render('edit-user',{
                userDetails : existingUser
            });
        }
    });

})

app.post('/login', (req,res)=>{
    //console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;

    fs.readFile(p,(err,fileContent)=>{
        let userList = [];
        if(!err){
            userList = JSON.parse(fileContent);
        }
        //console.log(userList);
        const userToMatch = userList.find(user => user.email === email);
        //console.log(userToMatch);
        if (typeof userToMatch === 'undefined'){
            res.render('login',{
                errorMsg : "email does not match"
            });
        }
        else{
            bcrypt.compare(password,userToMatch.password,(err,result)=>{
                if(result){
                    console.log("user matched");
                    const url = '/dashboard/'+userToMatch.id;
                    console.log(url);
                    res.redirect(url);
                }
                else{
                    console.log("wrong password");
                    res.render('login',{
                        errorMsg : "password does not match"
                    });
                }
            });
        }
        
    });
});

app.get('/register',(req,res,next)=>{
    res.render('register',{
        errorMsg : false
    });
});

app.post('/register', async (req, res) => {
    try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    fs.readFile(p,(err,fileContent)=>{
        let usersList = [];
        if(!err){
        usersList = JSON.parse(fileContent);
        }
        console.log(usersList);
        const userIfPresent = usersList.find(
            user => user.email === req.body.email
        );
        if( typeof userIfPresent === 'undefined'){
            const id = Date.now().toString();
            usersList.push({
                id: id,
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            });
            fs.writeFile(p,JSON.stringify(usersList),err=>{
                console.log(err);
                });
            fs.readFile(q,(err,fileContent)=>{
                userCardList = [];
                if(!err){
                    userCardList = JSON.parse(fileContent);
                }
                userToPush = { id : id , cards : []};
                userCardList.push(userToPush);
                fs.writeFile(q,JSON.stringify(userCardList),err=>{
                    console.log(err);
                });
                res.redirect('/login');
            });
        }
        else{
            res.render('register',{
                errorMsg : "User Already Exists"
            });
        }
        
    });
    } catch {
    res.redirect('/register');
    }
});

app.get('/',(req,res,next)=>{
    res.render('home');
});

app.listen(3000);