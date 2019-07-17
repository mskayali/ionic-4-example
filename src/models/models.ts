import {EventEmitter} from '@angular/core';

declare global {
   interface Array<T> {
        findWithAttr(attr, value):number
   		unique():Array<T>
   }
   interface Date {
      toYii(): string;
      getAge(): number;
      daysBetween(date:Date): number;
   }
   interface String{
      hashCode():string;
   }
}
Array.prototype.findWithAttr= function(attr, value):number {
    for(var i = 0; i < this.length; i += 1) {
        if(this[i][attr] === value) {
            return i;
        }
    }
    return -1;
}
Array.prototype.unique= function():Array<any> {
    let filter=(value, index, self)=>{ 
        return self.indexOf(value) === index;
    }
    return this.filter(filter);
}
Date.prototype.toYii=function ():string {
	let date = this;
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    // let res = date.getFullYear() + '-' +
    //     date.getMonth() + '-' +
    //     date.getDate() + ' ' +
    //     date.getHours() + ':' +
    //     date.getMinutes() + ':' +
    //     date.getSeconds() ;
    // return res;

	return date.toISOString().substr(0,19).replace('T',' ')
}
Date.prototype.getAge=function ():number {
	let birthDate = this;
	var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
Date.prototype.daysBetween=function (date:Date):number {
    var one_day=1000*60*60*24;    // Convert both dates to milliseconds
    var date1_ms = this.getTime();   
    var date2_ms = date.getTime();    // Calculate the difference in milliseconds  
     var difference_ms = date2_ms - date1_ms;        // Convert back to days and return   
    return Math.round(difference_ms/one_day); 
}

String.prototype.hashCode = function():string {
	return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0); 
};

export interface ConfigurableInterface {
    load(json);
    init(json);
}




export class BaseObject implements ConfigurableInterface {

    constructor(json={}){
	    this.loadInit(json);
    }

    public init(json){

    }

    public load(json){
    	for(let prop in json) {
	      try{
            	this[prop] = json[prop];
        	}catch(err){
        		console.error(err);
        	} 
            
	    }
		try{
	    	this.init(json);
		}catch(err){
			console.error(err);
		} 
    }

    loadInit(json){
    	this.load(json);
	    this.init(json);
    }




}

export class BaseModel extends BaseObject{
	
	private _old;
    constructor(json={}){
	   	super(json);
        if(typeof this.errors == 'undefined') this.errors=[]; 
	    this._old=json;

    }

	get primary_key():string{
		return 'id';
	}

	validate():boolean{
		return false;
	}
    
	get isNewRecord():boolean {
		return this[this.primary_key]==null;
	}

	get saveKey():string{
		return this[this.primary_key];
	}

	get saveData():BaseModel
	{
		return this;
	}

 	public changedAttributes()
    {
    	let changedAttributes=[];
    	if(!this._old)
    	{
    		this._old={};	
    	}
    	for(let prop in this) {
	      try{
	      		if(( (typeof this[prop] =='object' && this[prop]==null) || ['string','number','integer', 'boolean'].indexOf(typeof this[prop])>-1)  && this[prop] !== this._old[prop]){
	      			changedAttributes.push(prop);
	      		}
        	}catch(err){
        		console.error(err);
        	} 
            
	    }
		return changedAttributes;
    }


    public getDiffAttributes()
    {
    	let diff=new BaseObject();
        let excludes=['_old', 'errors', 'isNewRecord', 'saveData'];
    	diff[this.primary_key]=this[this.primary_key]
    	this.changedAttributes().filter(attr=>excludes.indexOf(attr)<0).map(prop=>diff[prop]=this[prop])
		return diff;
    }

    errors:FieldValidationError[];

    static _afterValidate=new EventEmitter<BaseModel>();

    get afterValidate():EventEmitter<BaseModel>{
        return BaseModel._afterValidate;
    }


    dateGetter(attribute){

        if(!this[attribute])
            return null;
        try{
            return new Date(this[attribute]).toYii().substr(0,10);
        } catch (error){
            return null;
        }
    }

    dateSetter(val,attribute){
        try{
            let valDate = new Date(val);
            let attributeDate= new Date(this[attribute]);
            attributeDate.setFullYear(valDate.getFullYear());
            attributeDate.setDate(valDate.getDate());
            attributeDate.setMonth(valDate.getMonth());
            this[attribute]=attributeDate.toYii();
        }catch(err){
            this[attribute]=null;
        }
    }

    timeGetter(attribute){
        if(!this[attribute])
            return null;
        try{
            return this[attribute].substr(11,5);
        } catch (error){
            return null;
        }
    }

    timeSetter(val,attribute)
    {
        let newDate=this.dateGetter(attribute)+ ' '+ val + ':00';
        if(new Date(newDate) instanceof Date){
           this[attribute]=newDate
        }else{
            this[attribute]=null
        }
    }


}

export class FieldValidationError extends BaseObject
{
    field:string
    message:string
}
export class ModelValidationError extends BaseObject
{
    short:string
    full:string
    errors:FieldValidationError[]

    init(json)
    {
        this.errors=json.errors.map(val=>new FieldValidationError(val));
    }
}


export class ValidationExcetionResponse extends BaseObject
{
    validation:ModelValidationError[]
    message:string
    init(json){
        this.validation=json.validation.map(val=>new ModelValidationError(val));
    }

    loadToModels(data:{})
    {
        let keys = Object.keys(data);
        for (let prop in data) {
            try{
                this.validation.map(val=>{
                    if(val.short==prop && data[prop].afterValidate)
                    {
                        data[prop].errors=val.errors
                        data[prop].afterValidate.emit(data[prop])
                    }
                });
            } catch (err){
                console.error(err);
            }

        }
        
    }
}




export class ActiveDataProvider<T> extends BaseModel{
	models:T[]
	count:number
	totalCount:number
	page:number
	pageCount:number

	map(f: (item,index) => T)
	{
		this.models=this.models.map(f);
		return this;
	}
}


export class User extends BaseModel {
    id:number
    userName:string
    eMail:string
    password:string
}


