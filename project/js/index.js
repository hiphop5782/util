Vue.createApp({
    data(){
        return {
            project:{
                title:"",
                period:{
                    begin:"2001-01-01",
                    end:"2001-01-01",
                    total:0,
                    actual:0,
                }
            },
            schedules:[],
            now:moment(),
            styles:{
                clear:{"color":"gray"},
                almost:{"color":"red"},
                remain:{"color":"black"}
            },
            solarHolidays : [],
            lunarHolidays : [],
            notices:[],                
            converter:new LunarSolarConverter(),
        };
    },
    computed:{
        nowFormat(){
            return this.now.format("YYYY-MM-DD dddd HH:mm:ss");
        },
        datePercent(){
            if(this.project.period.total == 0) return 0.0;
            const percent = this.project.period.actual / this.project.period.total * 100;
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
            this.project.period.total = 0;

            const begin = moment(this.project.period.begin, 'YYYY-MM-DD');
            const end = moment(this.project.period.end, 'YYYY-MM-DD');

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

            this.project.period.total = total;
            this.project.period.actual = actual;
        },
        async loadProject() {
            //프로젝트 정보
            this.project = await fetch("./json/project.json")
                                .then(response=>response.json());

            //일정 정보
            this.schedules = await fetch("./json/schedule.json")
                                .then(response=>response.json());

            //휴일 정보
            const holidayJson = await fetch("./json/holiday.json")
                                .then(response=>response.json());
            this.solarHolidays = holidayJson.solarHolidays;
            this.lunarHolidays = holidayJson.lunarHolidays;

            //공지사항 목록
            this.notices = await fetch("./json/notice.json")
                                .then(response=>response.json());

            this.calculateWorkingDay();
        },
    },
    created(){
        this.now = moment();
        this.loadProject();
        
        setInterval(()=>{
            this.now = moment();

            this.schedules.forEach((s)=>{
                const timeObj = moment(s.time, 'HH:mm');
                s.clear = timeObj.isBefore(this.now);
            });
        }, 1000);
    },
}).mount("#app");