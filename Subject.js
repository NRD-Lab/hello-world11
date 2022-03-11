import {config} from "./config.js"
// preflight
// createSubject
//
class Subject{
    constructor(subjectKey){
        this.subjectKey = subjectKey
        this.endpoints = Object.keys(config.dataParams.writeEndpoints)
        this.preflightSubject = this.preflightSubject.bind(this)
        this.uploadData = this.uploadData.bind(this)
    }
    async preflightSubject(dataParams){
        return submitPreflight(this.subjectKey,dataParams,config.dataParams.relayName)
    }
    async uploadData(final=false){
        if (!final){
            return uploadFiles(config.host,dataParams,config.dataParams.relayName,this.subjectKey)
        }else{
            return null
        }
    }
}

async function createSubject(metaData="",password=""){
    if (config.archived){
        return new Subject("0000000")
    }else{
        let subjectKey = await createSubjectKey(config.host, config.dataParams.relayName,password,metaData)
        return new Subject(subjectKey)
    }
}

async function submitPreflight(host, subjectKey, params,relayName){
    if (config.archived){
        return {success:true,failedFiles:{}}
    }else{
        try{
            let dataPreflight=await uploadFiles(host, params,relayName,subjectKey)
            if (Object.keys(dataPreflight.failedFiles).length===0){
                return {success:true,failedFiles:dataPreflight}
            }
            else{
                return {success:false,failedFiles:dataPreflight}
            }
        }
        catch(e){
            throw e
        }
    }
}
async function createSubjectKey(host,relayName,password,metaData){
    if (config.archived){
        return "0000000"
    }
    try{
        let res = await fetch(`${host}/SubjectKey/createSubjectKey`,{
        headers:{
        'Content-Type': 'application/json',
        authorization:`relayName:${relayName};password:${password}`},
        method:"POST",
        body:JSON.stringify({metaData:metaData})})
        if (res.status == 200){
            let response = await res.json()
            return response.subjectKey}
        else{
            return await res.text()
        }
    }
    catch(e){
        console.log(e)
    }
}

//todo: add close files to server
//todo: test
//downloads if close and archived, else sends to server
async function uploadFiles(host, params,relayName,subjectKey){
    if (config.archived){
        for (const fileInfo of params){
            if (fileInfo.close){
                download(fileInfo.fname,fileInfo.data)
            }
        }
        return {success:true}
    }else{
        try{
            var fd=new FormData()
            for ( const fileInfo of params){
                let URL = new Blob([fileInfo.data], { type: 'text/csv;charset=utf-8;' });
                if (fileInfo.close){
                    fd.append("close",`${fileInfo.endpoint}:${fileInfo.fname}`)
                }else{
                    fd.append(fileInfo.endpoint,URL,fileInfo.fname)
                }
            }
            let res = await fetch(`${config.host}/Upload`,{
                headers:{authorization:`relayName:${relayName};subjectKey:${subjectKey}`},
                method:"POST",
                body: fd})
            return await res.json()}
        catch(e){
            console.log(e)
        }
    }
    }
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
    }
(async ()=>{
    let subject = await createSubject()
    console.log(subject.endpoints)
})()
export default Subject