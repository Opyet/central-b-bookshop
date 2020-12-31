import React from 'react';
import ReactLoading from 'react-loading';
 
const Loader = ({ type, size, color }) => {
    let height = 0;
    let width = 0;
    if(size == 'small'){
        height = 30;
        width = 30;
    }else if(size == 'medium'){
        height = 100;
        width = 100;
    }else if(size == 'large'){
        height = 240;
        width = 240;
    }else{
        height = 30;
        width = 30;
    }
    return <ReactLoading type={type} color={color} height={height} width={width} />
}
 
export default Loader;