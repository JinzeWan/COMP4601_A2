let beginTime = +new Date();

let fs = require("fs");
let _ = require('lodash');
let neig_limit = 300;
let no_valid = 0;
let neig_use = 0;

function create_output_array(data_arr){
    let output_arr = [];
    for(let i = 0; i < data_arr.length; i++){
        output_arr.push(data_arr[i].split(" "));
    }
    return output_arr;
}

function compute_rating_average_orig(arr, user_number, product_number){
    let r_arr = [];
    for(let i = 0; i < user_number; i++){
        let rating_total = 0;
        let rating_count = 0;

        for(let h = 0; h < product_number; h++){
            if(parseFloat(arr[i+3][h]) != 0){
                rating_total += parseFloat(arr[i+3][h]);
                rating_count ++;
            }
        }

        r_arr.push(rating_total/rating_count);            
    }
    return r_arr;    
}

function compute_rating_average(n, m, arr, product_number){
    let rating_total = 0;
    let rating_count = 0;

    for(let h = 0; h < product_number; h++){
        if(m == h){

        }
        else if(parseFloat(arr[n+3][h]) != 0){
                rating_total += parseFloat(arr[n+3][h]);
                rating_count ++;
        }
    }
     

    return rating_total/rating_count;    
}


function compute_sim(n, m, arr, rating_aver_arr, user_number, product_number){
    let sim_arr = [];

    for(let i = 0; i < product_number; i++){
        let nume = 0;
        let deno1 = 0;
        let deno2 = 0;

        if(i != m){
            for(let u = 0; u < user_number; u++){
                if(u == n){
                    
                }
                else if(parseFloat(arr[u+3][i]) != 0 && parseFloat(arr[u+3][m]) != 0){
                    nume += (parseFloat(arr[u+3][i]) - rating_aver_arr[u]) * (parseFloat(arr[u+3][m]) - rating_aver_arr[u]);
                    deno1 += Math.pow(parseFloat(arr[u+3][i]) - rating_aver_arr[u], 2);
                    deno2 += Math.pow(parseFloat(arr[u+3][m]) - rating_aver_arr[u], 2);
                }
            }
            let deno = Math.sqrt(deno1) * Math.sqrt(deno2);
            let sim = nume/deno;
            sim_arr.push(sim);
        }

        else{
            sim_arr.push(-1000);
        }
    }
    
    return sim_arr;
}


// n represent the index of user, m represent the index of product
function compute_pred(n, m, arr, rating_aver_arr_orig, user_number, product_number){
    let nume = 0;
    let deno = 0;
    let neig_arr = [];
    let rating_aver_arr = _.cloneDeep(rating_aver_arr_orig);
    rating_aver_arr[n] = compute_rating_average(n, m, arr, product_number);

    let sim_arr = compute_sim(n, m, arr, rating_aver_arr, user_number, product_number);

    //console.log(n + " " + m);

    for(let i = 0; i < product_number; i++){
        if(i != m && !Number.isNaN(sim_arr[i]) && parseFloat(sim_arr[i]) > -0.1 && parseFloat(arr[n+3][i]) != 0){
            if(neig_arr.length < neig_limit){

                neig_arr.push([i, sim_arr[i]]);
            }
            else{
                //console.log(neig_arr[0] + " " + neig_arr[1]);
                //console.log("insert: " + [i, sim_arr[m][i]]);
                neig_arr.push([i, sim_arr[i]]);
                let index = smallest_sim(neig_arr);
                neig_arr.splice(index, 1);
                //console.log(neig_arr[0] + " " + neig_arr[1]);
            }
        }
    }

    for(let i = 0; i < neig_arr.length; i++){
        let index = neig_arr[i][0];
        let sim = neig_arr[i][1];
        nume += parseFloat(sim) * parseFloat(arr[n+3][index]);
        deno += parseFloat(sim);
    }

    neig_use += neig_arr.length;

    if(neig_arr.length == 0 || deno == 0){
        no_valid ++;

        if(false){
        console.log("n: " + arr[1][n] + " m: " + arr[2][m] + " number of neighbour: " + neig_arr.length);
        console.log("no valid");
        console.log(rating_aver_arr[n]);
        console.log(" ");
        }
        
        return parseFloat(rating_aver_arr[n]);
    }
    else if (neig_arr.length != 0 || deno != 0){
        
        if(false){
        console.log("n: " + arr[1][n] + " m: " + arr[2][m] + " number of neighbour: " + neig_arr.length);
        for(let i = 0; i < neig_arr.length; i++){
            console.log(neig_arr[i]);
        }
        console.log(nume/deno);
        console.log(" ");
        }
        
        return nume/deno;
    }

}

function smallest_sim(neig_arr){
    let smallest = 1000;
    let smallest_index = -1;

    for(let i = 0; i < neig_arr.length; i++){
        if(neig_arr[i][1] < smallest){
            smallest_index =  i;
            smallest = neig_arr[i][1];
        }
    }

    if(smallest_index == -1){
        console.log("debug");
        for(let i = 0; i < neig_arr; i++){
            console.log(neig_arr[i]);
        }
    };

    return smallest_index;
}

function item_based_recom(file_dir){
    let user_number;
    let product_number;
    let data_arr;
    let output_arr;
    let rating_aver_arr_orig;
    let MAE_nume = 0;
    let MAE_deno = 0;

    fs.readFile(file_dir, function (err, data) {
        if (err) {
            return console.error(err);
        }
        data_arr = data.toString().split("\n");
        user_number = parseInt(data_arr[0].split(" ")[0]);
        product_number = parseInt(data_arr[0].split(" ")[1]);  
        output_arr = create_output_array(data_arr);

        rating_aver_arr_orig = compute_rating_average_orig(output_arr, user_number, product_number);

        /*
        for(let key in sim_arr){
            console.log(sim_arr[key]);
        }
        */

        for(let i = 0; i < user_number; i ++){
            for(let h = 0; h < product_number; h ++){           
                if(parseFloat(output_arr[i+3][h]) != 0){
                    let tmp = compute_pred(i, h, output_arr, rating_aver_arr_orig, user_number, product_number);
                    MAE_nume += Math.abs(tmp - parseFloat(output_arr[i+3][h]));
                    MAE_deno ++;
                }
            }
        }

        //console.log(data_arr[2]);
        //console.log(data_arr[3]);
        console.log(MAE_nume/MAE_deno);
        console.log(no_valid);
        console.log(neig_use/MAE_deno);
        console.log(MAE_deno);
        let endTime = +new Date();
        console.log((endTime - beginTime) + "ms");
     });
 }


item_based_recom("assignment2-data.txt");
