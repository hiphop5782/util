Vue.createApp({
    data(){
        return {
            title:"세미 프로젝트",
            period:{
                begin:"2022-10-19",
                end:"2022-11-01",
                total:0,
                actual:0,
            },
            schedules:[
                {name:"출근", time:"09:30", clear:false},
                {name:"업무 목표 작성", time:"10:00", clear:false},
                {name:"점심 시간", time:"12:12", clear:false},
                {name:"오후 업무 시작", time:"13:30", clear:false},
                {name:"업무 마감 작성", time:"18:00", clear:false},
                {name:"퇴근", time:"18:20", clear:false},
            ],
            now:moment(),
            styles:{
                clear:{"color":"gray"},
                almost:{"color":"red"},
                remain:{"color":"black"}
            },
            solarHolidays : [
                {date:"01-01", name:"신정", replace:false},
                {date:"03-01", name:"삼일절", replace:true},
                {date:"05-05", name:"어린이날", replace:true},
                {date:"06-06", name:"현충일", replace:false},
                {date:"08-15", name:"광복절", replace:true},
                {date:"10-03", name:"개천절", replace:true},
                {date:"10-09", name:"한글날", replace:true},
                {date:"12-25", name:"크리스마스", replace:false},
            ],
            lunarHolidays : [
                {date:"12-31", name:"구정", replace:false},
                {date:"01-01", name:"구정", replace:true},
                {date:"01-02", name:"구정", replace:false},
                {date:"04-08", name:"석가탄신일", replace:false},
                {date:"08-14", name:"추석", replace:false},
                {date:"08-15", name:"추석", replace:true},
                {date:"08-16", name:"추석", replace:false},
            ],                
            converter:new LunarSolarConverter(),
        };
    },
    computed:{
        nowFormat(){
            return this.now.format("YYYY-MM-DD dddd HH:mm:ss");
        },
        datePercent(){
            if(this.period.total == 0) return 0.0;
            const percent = this.period.actual / this.period.total * 100;
            return percent.toFixed(1);
        }
    },
    watch:{
        now(a, b){
            if(!a.isSame(b, 'day')) {
                calculateWorkingDay();
            }
        },
    },
    methods:{
        getStyle(schedule){
            if(schedule.clear){
                return this.styles.clear;
            }
            
            const timeObj = moment(schedule.time, 'HH:mm');
            if(timeObj.diff(this.now, 'hours') == 0) {
                return this.styles.almost;
            }
            else {
                return this.styles.remain;
            }
        },
        calculate(time){
            const timeObj = moment(time, 'HH:mm');
            if(timeObj.isBefore(this.now)){
                return "완료되었습니다";
            }
            else {
                return moment.utc(timeObj.diff(this.now)).format('H시간 m분 s초 남았습니다');
            }
        },
        calculateWorkingDay(){
            this.period.total = 0;
            const begin = moment(this.period.begin, 'YYYY-MM-DD');
            const end = moment(this.period.end, 'YYYY-MM-DD');

            let diff = end.diff(begin, 'days') + 1;
            let total = 0;
            let actual = 0;
            let d = begin.startOf('day');

            let replaceHolidayCount = 0;
            for(let i=0; i < diff; i++){
                //console.log(d.format('YYYY-MM-DD'), d.days(), d.days() === 0, d.days() === 6 );
                let weekend = false;
                let holiday = false;
                //주말 검사
                if(d.days() == 0 || d.days() == 6){
                    weekend = true;
                }

                //양력 휴일 검사
                for(let k=0; k < this.solarHolidays.length; k++){
                    const t = this.solarHolidays[k];
                    if(t.date === d.format("MM-DD")) {
                        holiday = true;
                        replaceHolidayCount += t.replace ? 1 : 0;
                        break;
                    }
                }
                
                //양력 휴일이 아닌 경우
                if(holiday == false){
                    //음력 휴일 검사
                    var solar = new Solar();
                    solar.solarYear = d.year();
                    solar.solarMonth = d.month()+1;
                    solar.solarDay = d.date(); 
                    var lunar = this.converter.SolarToLunar(solar);
                    var lunarText = moment({year:lunar.lunarYear, month:lunar.lunarMonth-1, day:lunar.lunarDay}).format('MM-DD');
                    for(var k=0; k < this.lunarHolidays.length; k++){
                        const t = this.lunarHolidays[k];
                        if(t.date === d.format("MM-DD")) {
                            holiday = true;
                            replaceHolidayCount += t.replace ? 1 : 0;
                            break;
                        }
                    }
                }

                if(weekend == false && holiday == false) {//휴일은 아니고
                    if(replaceHolidayCount > 0){//대체휴일 카운트가 있다면
                        replaceHolidayCount--;//대체휴일 처리하고 skip
                    }
                    else {//대체휴일 카운트가 없다면
                        if(d.isBefore(this.now)){//현재보다 이전 날짜일 경우
                            actual++;//진행 카운트 증가
                        }
                        total ++;//업무일 카운트 증가
                    }
                }
                
                //하루 뒤로 변경
                d.add(1, 'day');
            }

            this.period.total = total;
            this.period.actual = actual;
        }
    },
    created(){
        this.now = moment();
        this.calculateWorkingDay();

        setInterval(()=>{
            this.now = moment();

            this.schedules.forEach((s)=>{
                const timeObj = moment(s.time, 'HH:mm');
                s.clear = timeObj.isBefore(this.now);
            });
        }, 1000);
    },
}).mount("#app");