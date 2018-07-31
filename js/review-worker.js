importScripts('dbhelper.js');

 this.onmessage = (e) => {
   let waitTime = 5 * 1000;
   let sendReview = () => {
     return DBHelper.sendRestaurantReview(e.data)
       .then(review => {
         postMessage(review);
       })
       .catch(() => {
        waitTime *= 1.5;
         setTimeout(sendReview, waitTime);
       })
   };
   sendReview();
 }; 