import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray, ValidatorFn, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';

declare const bootstrap:any;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
})
export class AppComponent implements OnInit{

  constructor(private fb: FormBuilder){}

  rummyForm : any;
  gameStarted : boolean = false;
  gameForm : any;
  gameCount:number = 120;
  players : any = [];
  noOfMatches:number = 0;
  gameType : any = 'traditional';
  winner:any;

  ngOnInit(): void {
    this.rummyForm = this.fb.group({
      hints: this.fb.array([],[this.uniqueArrayValidator()])
    })
    this.gameForm = this.fb.group({
    });
    let gameData : any = localStorage.getItem('gameData')
    if(gameData){
      gameData = JSON.parse(gameData);
      console.log(gameData)
      let names = [];
      for(let i of gameData.players){
        names.push(i.name);
        this.gameForm.addControl(i.name, new FormControl('', Validators.required));
      }
      this.populateHints(names);
      this.players = gameData.players;
      this.noOfMatches = gameData.noOfMatches;
      this.gameType = gameData.gameType;
      this.winner = gameData.winner;
      this.gameCount = gameData.gameCount;
      this.gameStarted = gameData.gameStarted;
    }
    else{
      this.addHint();
      this.addHint();
    }
  }

  uniqueArrayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valueArray = control.value as string[];
      const hasDuplicates = valueArray.some((item, index) => {
        return valueArray.indexOf(item) !== index;
      });
      return hasDuplicates ? { uniqueArray: true } : null;
    };
  }
  
  // Getter to access hints FormArray
  get hints(): FormArray {
    return this.rummyForm.get('hints') as FormArray;
  }

  // Method to add a hint to the array
  addHint(): void {
    this.hints.push(this.fb.control('', Validators.required));
  }

  // Method to remove a hint from the array
  removeHint(index: number): void {
    this.hints.removeAt(index);
    if (this.rummyForm.value.hints.length == 1) {
      this.addHint();
    }
  }

  // Method to populate the form array with existing hints
  populateHints(hints: string[]) {
    hints.forEach(hint => this.hints.push(this.fb.control(hint, Validators.required)));
  }

  submit(){
    if(this.rummyForm.valid){
      this.players = [];
      this.gameStarted = true;
      for(let i of this.rummyForm.value.hints){
        let data = {
          name : i,
          score: 0
        }
        this.players.push(data);
        this.gameForm.addControl(i, new FormControl('', Validators.required));
      }
      this.setlocal();
    }
    else{
      let basic = this.rummyForm.controls.hints.controls;
      for(let i of basic){
        if(!i.valid){
          i.markAsDirty();
        }
      }
    }
  }

  checkGame(){
    if(this.gameForm.valid){
      for(let i of this.players){
        if(i.score < this.gameCount){
          i.score += this.gameForm.value[i.name];
        }
      }
      this.noOfMatches += 1;
      if(this.gameType == 'infinite'){
        const minScore = Math.min(...this.players.map((item:any) => item.score));

        this.players.forEach((item:any) => {
          item.score -= minScore;
        });
      }
      this.determineWinner(this.players);
      this.gameForm.reset();
    }
    else{
      const controls = this.gameForm.controls;
      for (const name in controls) {
          if (controls[name].invalid) {
              controls[name].markAsDirty()
          }
      }
    }
  }

  determineWinner(players:any) {
    const playersWith120 = players.filter((player:any) => player.score >= this.gameCount);
  
    if (playersWith120.length === players.length-1) {
      const winner = players.find((player:any) => player.score < this.gameCount);
      this.winner = winner.name;
      const modal = new bootstrap.Modal('#winner', {
        backdrop: 'static', // This prevents the modal from closing when clicking outside
        keyboard: false // This prevents the modal from closing when pressing the Escape key
      });
      modal.show();
    }
    this.setlocal();
  }

  resetGame(){
    this.removeAllControls();
    this.noOfMatches = 0;
    this.players = [];
    this.gameStarted = false;
    this.rummyForm.reset();
  }

  // Method to remove all controls from the FormGroup
  removeAllControls() {
    Object.keys(this.gameForm.controls).forEach((key) => {
      this.gameForm.removeControl(key);
    });
  }

  // used to store game data in local storage
  setlocal(){
    let data = {
      gameStarted : this.gameStarted,
      players : this.players,
      noOfMatches : this.noOfMatches,
      gameType : this.gameType,
      winner : this.winner,
      gameCount : this.gameCount
    }
    localStorage.setItem('gameData',JSON.stringify(data))
  }

}