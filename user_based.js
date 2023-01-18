let beginTime = +new Date();

var fs = require("fs");
var _ = require('lodash');
var neig_limit = 70;

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

function compute_sim(n, m, arr, aver_arr, user_number, product_number){
    let sim_arr = [];

    for(let i = 0; i < user_number ; i++){


        let nume = 0;
        let deno1 = 0;
        let deno2 = 0;

        if(i != n){
            for(let k = 0; k < product_number; k++){
                if(k == m){

                }
                else if(parseFloat(arr[i+3][k]) != 0 && parseFloat(arr[n+3][k]) != 0){
                    nume += (parseFloat(arr[i+3][k]) - parseFloat(aver_arr[i])) * (parseFloat(arr[n+3][k]) - parseFloat(aver_arr[n]));
                    deno1 += Math.pow(parseFloat(arr[i+3][k]) - parseFloat(aver_arr[i]), 2);
                    deno2 += Math.pow(parseFloat(arr[n+3][k]) - parseFloat(aver_arr[n]), 2);
                }
            }
            let deno = Math.sqrt(deno1) * Math.sqrt(deno2);
            sim_arr.push(nume/deno);
        }
        // use -1000 to represent the similarity of itself
        else{
            sim_arr.push(-1000)
        }
    }
    
    return sim_arr;
}

// n represent the index of user, m represent the index of product
function compute_pred(n, m, arr, rating_aver_arr_orig, user_number, product_number){
    let nume = 0;
    let deno = 0;
    let neig_arr = [];
    let r_aver_arr = _.cloneDeep(rating_aver_arr_orig);
    r_aver_arr[n] = compute_rating_average(n, m, arr, product_number);

    let sim_arr = compute_sim(n, m, arr, r_aver_arr, user_number, product_number);

    //console.log(n + " " + m);

    for(let i = 0; i < user_number; i++){
        if(n != i && !Number.isNaN(sim_arr[i]) && sim_arr[i] > 0 && parseFloat(arr[i+3][m]) != 0){
            if(neig_arr.length < neig_limit){

                neig_arr.push([i, sim_arr[i]]);
            }
            else{
                neig_arr.push([i, sim_arr[i]]);
                let index = smallest_sim(neig_arr);
                neig_arr.splice(index, 1);
            }
        }
    }

    //console.log(sim_arr[n]);
    //console.log(neig_arr.length);
    for(let i = 0; i < neig_arr.length; i++){
        let index = neig_arr[i][0];
        let sim = neig_arr[i][1];
        let rating = parseFloat(arr[index + 3][m]);
        nume += sim * (rating - r_aver_arr[index]);
        deno += sim;
    }

    if (deno != 0 && neig_arr.length != 0){
        return r_aver_arr[n]+(nume/deno);
    }
    else{
        return r_aver_arr[n];
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
function compute_PCC(file_dir){
    let user_number;
    let product_number;
    let data_arr;
    let output_arr;
    let MAE_nume = 0;
    let MAE_deno = 0;

    let rating_aver_arr_orig;

    fs.readFile(file_dir, function (err, data) {
        if (err) {
            return console.error(err);
        }
        data_arr = data.toString().split("\n");
        user_number = parseInt(data_arr[0].split(" ")[0]);
        product_number = parseInt(data_arr[0].split(" ")[1]);      
        output_arr = create_output_array(data_arr);
        rating_aver_arr_orig = compute_rating_average_orig(output_arr, user_number, product_number);

        for(let i = 0; i < user_number; i ++){
            for(let h = 0; h < product_number; h ++){           
                if(parseFloat(output_arr[i+3][h]) != 0){
                    let tmp = compute_pred(i, h, output_arr, rating_aver_arr_orig, user_number, product_number);
                    //console.log(tmp);
                    if(Number.isNaN(tmp)){console.log("bug! " + tmp);}
                    MAE_nume += Math.abs(tmp - parseFloat(output_arr[i+3][h]));
                    MAE_deno ++;
                }
            }
        }

        //console.log(data_arr[2]);
        //console.log(data_arr[3]);
        console.log(MAE_nume/MAE_deno);
        console.log(MAE_deno);
        let endTime = +new Date();
        console.log((endTime - beginTime) + "ms");
     });
 }

 compute_PCC('assignment2-data.txt');

 //compute_PCC('test3.txt');