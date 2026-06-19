const matches=document.querySelectorAll(".match");

matches.forEach(match=>{

    match.onclick=()=>{

        alert("Bạn đã chọn: "+match.innerText);

    }

});
const express = require("express");
const app = express();

// cho phép dùng thư mục public
app.use(express.static("public"));

app.listen(8080, () => {
  console.log("Server running on 8080");
});
const commentators = {
    1: {
        name: "BLV CC",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1uVSM9r1_XhM7TM-pe-jU7xWh3q0vx-gVCUryaNeW0Q&s=10"
    },
    
};
.chat-box{
    height:500px;
    overflow-y:auto;
}